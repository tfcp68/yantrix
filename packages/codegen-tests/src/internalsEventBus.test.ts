import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ModuleNames } from '@yantrix/codegen';
import {
	AutomataEventAdapter,
	CoreLoop,
	IAutomataEventBus,
	waitForEventOnce,
} from '@yantrix/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { generateAndSave } from './fixtures/utils.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const getFixturePath = (name: string) => path.resolve(dirname, 'fixtures/generated', name);

// Numeric event IDs for the test bus
enum TestEvents {
	TICK = 1, // triggers tick action on subscribed automata
	CHAIN = 2, // emitted by A in chain tests; triggers tick on B
	DONE = 3, // emitted by the last automata in a chain; awaited by tests
}

type TTestMeta = Record<TestEvents, Record<string, never>>;
type TBus = IAutomataEventBus<TestEvents, TTestMeta>;

const input = `stateDiagram-v2
[*] --> Active: init
Active --> Active: tick
note left of Active
  +Init
  #{epoch} <= _currentEpoch()
  #{cycle} <= _currentCycle()
  #{ts}    <= _currentTimestamp()
end note
`;

describe('automata internals via EventBus', async () => {
	await generateAndSave(
		{ input, automataName: 'EpochCycleTracker', lang: ModuleNames.JavaScript },
		'internals_epochCycleTracker',
	);

	const { EpochCycleTracker, actionsDictionary: actions, statesDictionary } = await import(
		getFixturePath('internals_epochCycleTracker_generated.js')
	);

	// ------------------------------------------------------------------
	// Group 1: timestamp monotonicity (direct dispatch, no bus)
	// ------------------------------------------------------------------
	describe('timestamp monotonicity', () => {
		let instance: InstanceType<typeof EpochCycleTracker>;

		beforeEach(() => {
			instance = new EpochCycleTracker();
		});

		it('_currentTimestamp is non-decreasing across sequential dispatches', () => {
			const ts0 = instance.getContext().context.ts;
			instance.dispatch({ action: actions.tick, payload: {} });
			const ts1 = instance.getContext().context.ts;
			instance.dispatch({ action: actions.tick, payload: {} });
			const ts2 = instance.getContext().context.ts;
			expect(ts1).toBeGreaterThanOrEqual(ts0);
			expect(ts2).toBeGreaterThanOrEqual(ts1);
		});

		it('_currentTimestamp is a positive number on every dispatch', () => {
			instance.dispatch({ action: actions.tick, payload: {} });
			expect(instance.getContext().context.ts).toBeGreaterThan(0);
			instance.dispatch({ action: actions.tick, payload: {} });
			expect(instance.getContext().context.ts).toBeGreaterThan(0);
		});
	});

	// ------------------------------------------------------------------
	// Group 2: EventBus-driven epoch and cycle (CoreLoop, one instance)
	// ------------------------------------------------------------------
	describe('eventBus-driven epoch and cycle', () => {
		let loop: CoreLoop<TestEvents, TTestMeta>;
		let bus: TBus;
		let instanceA: InstanceType<typeof EpochCycleTracker>;

		beforeEach(() => {
			loop = new CoreLoop<TestEvents, TTestMeta>();
			bus = loop.getBus();
			instanceA = new EpochCycleTracker();

			const adapterA = new AutomataEventAdapter();
			adapterA.addEventListener(TestEvents.TICK, () => ({ action: actions.tick, payload: {} }));
			adapterA.addEventEmitter(statesDictionary.Active, () => ({ event: TestEvents.DONE, meta: {} }));

			loop.registerAutomata('a', instanceA, adapterA);
			loop.start();
		});

		it('first bus dispatch captures same epoch as construction (pre-increment semantics)', async () => {
			// +Init does NOT increment epoch; construction captures epoch=N but leaves counter at N.
			// First dispatch also captures N (pre-increment), then counter becomes N+1.
			const epochAtConstruction = instanceA.getContext().context.epoch;
			bus.dispatch({ event: TestEvents.TICK, meta: {} });
			await waitForEventOnce(bus, TestEvents.DONE);
			expect(instanceA.getContext().context.epoch).toBe(epochAtConstruction);
		});

		it('second bus dispatch captures epoch incremented by one vs first', async () => {
			bus.dispatch({ event: TestEvents.TICK, meta: {} });
			await waitForEventOnce(bus, TestEvents.DONE);
			const ep1 = instanceA.getContext().context.epoch;

			bus.dispatch({ event: TestEvents.TICK, meta: {} });
			await waitForEventOnce(bus, TestEvents.DONE);
			const ep2 = instanceA.getContext().context.epoch;

			expect(ep2).toBe(ep1 + 1);
		});

		it('cycle increments by one on each EventBus dispatch', async () => {
			bus.dispatch({ event: TestEvents.TICK, meta: {} });
			await waitForEventOnce(bus, TestEvents.DONE);
			const cy1 = instanceA.getContext().context.cycle;

			bus.dispatch({ event: TestEvents.TICK, meta: {} });
			await waitForEventOnce(bus, TestEvents.DONE);
			const cy2 = instanceA.getContext().context.cycle;

			expect(cy2).toBe(cy1 + 1);
		});
	});

	// ------------------------------------------------------------------
	// Group 3: two instances subscribed to same event (registration order)
	// ------------------------------------------------------------------
	describe('two instances subscribed to same event', () => {
		let loop: CoreLoop<TestEvents, TTestMeta>;
		let bus: TBus;
		let instanceA: InstanceType<typeof EpochCycleTracker>;
		let instanceB: InstanceType<typeof EpochCycleTracker>;

		beforeEach(() => {
			loop = new CoreLoop<TestEvents, TTestMeta>();
			bus = loop.getBus();
			instanceA = new EpochCycleTracker();
			instanceB = new EpochCycleTracker();

			// A registered first; no DONE emitter (processes before B)
			const adapterA = new AutomataEventAdapter();
			adapterA.addEventListener(TestEvents.TICK, () => ({ action: actions.tick, payload: {} }));

			// B registered second; emits DONE so tests can await B's completion
			const adapterB = new AutomataEventAdapter();
			adapterB.addEventListener(TestEvents.TICK, () => ({ action: actions.tick, payload: {} }));
			adapterB.addEventEmitter(statesDictionary.Active, () => ({ event: TestEvents.DONE, meta: {} }));

			loop.registerAutomata('a', instanceA, adapterA);
			loop.registerAutomata('b', instanceB, adapterB);
			loop.start();
		});

		it('both instances process when the same event is dispatched', async () => {
			const cycleA_before = instanceA.currentCycle;
			const cycleB_before = instanceB.currentCycle;
			bus.dispatch({ event: TestEvents.TICK, meta: {} });
			await waitForEventOnce(bus, TestEvents.DONE);
			expect(instanceA.currentCycle).toBeGreaterThan(cycleA_before);
			expect(instanceB.currentCycle).toBeGreaterThan(cycleB_before);
		});

		it('first-registered instance captures lower epoch than second (insertion order)', async () => {
			bus.dispatch({ event: TestEvents.TICK, meta: {} });
			await waitForEventOnce(bus, TestEvents.DONE);
			const contextA = instanceA.getContext().context;
			const contextB = instanceB.getContext().context;
			expect(contextA.epoch).toBeLessThan(contextB.epoch);
			expect(contextB.epoch).toBe(contextA.epoch + 1);
		});

		it('cycle counters are independent per instance', async () => {
			bus.dispatch({ event: TestEvents.TICK, meta: {} });
			await waitForEventOnce(bus, TestEvents.DONE);
			// Both received one dispatch: captured cycle values are equal
			expect(instanceA.getContext().context.cycle).toBe(instanceB.getContext().context.cycle);

			// Direct dispatch to A only: A advances, B stays
			instanceA.dispatch({ action: actions.tick, payload: {} });
			expect(instanceA.getContext().context.cycle).toBeGreaterThan(
				instanceB.getContext().context.cycle,
			);
		});
	});

	// ------------------------------------------------------------------
	// Group 4: chain reaction (A emits CHAIN, B reacts, B emits DONE)
	// ------------------------------------------------------------------
	describe('chain reaction: A emits -> B reacts', () => {
		let loop: CoreLoop<TestEvents, TTestMeta>;
		let bus: TBus;
		let instanceA: InstanceType<typeof EpochCycleTracker>;
		let instanceB: InstanceType<typeof EpochCycleTracker>;

		beforeEach(() => {
			loop = new CoreLoop<TestEvents, TTestMeta>();
			bus = loop.getBus();
			instanceA = new EpochCycleTracker();
			instanceB = new EpochCycleTracker();

			// A: listens to TICK, emits CHAIN when entering Active
			const adapterA = new AutomataEventAdapter();
			adapterA.addEventListener(TestEvents.TICK, () => ({ action: actions.tick, payload: {} }));
			adapterA.addEventEmitter(statesDictionary.Active, () => ({ event: TestEvents.CHAIN, meta: {} }));

			// B: listens to CHAIN, emits DONE (end-of-chain signal)
			const adapterB = new AutomataEventAdapter();
			adapterB.addEventListener(TestEvents.CHAIN, () => ({ action: actions.tick, payload: {} }));
			adapterB.addEventEmitter(statesDictionary.Active, () => ({ event: TestEvents.DONE, meta: {} }));

			loop.registerAutomata('a', instanceA, adapterA);
			loop.registerAutomata('b', instanceB, adapterB);
			loop.start();
		});

		it('chain completes: B dispatches after A emits CHAIN', async () => {
			const cycleB_before = instanceB.currentCycle;
			bus.dispatch({ event: TestEvents.TICK, meta: {} });
			await waitForEventOnce(bus, TestEvents.DONE);
			expect(instanceB.currentCycle).toBeGreaterThan(cycleB_before);
		});

		it('b.epoch === A.epoch + 1 (A dispatches first, B second)', async () => {
			bus.dispatch({ event: TestEvents.TICK, meta: {} });
			await waitForEventOnce(bus, TestEvents.DONE);
			const contextA = instanceA.getContext().context;
			const contextB = instanceB.getContext().context;
			expect(contextB.epoch).toBe(contextA.epoch + 1);
		});

		it('each instance dispatches exactly once: A.cycle === B.cycle', async () => {
			bus.dispatch({ event: TestEvents.TICK, meta: {} });
			await waitForEventOnce(bus, TestEvents.DONE);
			expect(instanceA.getContext().context.cycle).toBe(instanceB.getContext().context.cycle);
		});

		it('second chain: epoch increments by 2 per chain and ordering is preserved', async () => {
			// Chain 1
			bus.dispatch({ event: TestEvents.TICK, meta: {} });
			await waitForEventOnce(bus, TestEvents.DONE);
			const epochA_1 = instanceA.getContext().context.epoch;

			// Chain 2 — epoch advances by 2 (one per automata per chain)
			bus.dispatch({ event: TestEvents.TICK, meta: {} });
			await waitForEventOnce(bus, TestEvents.DONE);
			const epochA_2 = instanceA.getContext().context.epoch;
			const epochB_2 = instanceB.getContext().context.epoch;

			expect(epochA_2).toBe(epochA_1 + 2);
			expect(epochB_2).toBe(epochA_2 + 1);
		});
	});
});
