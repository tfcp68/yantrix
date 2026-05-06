import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ModuleNames } from '@yantrix/codegen';
import { assert, beforeEach, describe, expect, it } from 'vitest';
import { generateAndSave, generateAndSaveFiles } from './fixtures/utils.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const generatedDir = path.resolve(dirname, 'fixtures/generated');

const trafficInput = `stateDiagram-v2
	[*] --> Off: Reset (initialCounter=0)
	Off --> Red: Switch
	Red --> RedYellow: Switch
	RedYellow --> Green: Switch
	Green --> Yellow: Switch
	Yellow --> Red: Switch
note right of [*]
#{ counter = 0 } <= coalesce($initialCounter, inc(#counter = 0))
end note
note left of Off
+Init
end note
`;

describe('pure-typescript codegen - state transitions and context', async () => {
	await generateAndSave(
		{ input: trafficInput, automataName: 'TrafficLightTS', lang: ModuleNames.PureTypeScript },
		'pts_traffic',
	);

	const mod = await import(`./fixtures/generated/pts_traffic_generated.js`);
	const { statesDictionary, actionsDictionary, createTrafficLightTS } = mod;

	let fsm: ReturnType<typeof createTrafficLightTS>;

	beforeEach(() => {
		fsm = createTrafficLightTS();
	});

	it('factory returns a non-null instance', () => {
		assert.isNotNull(fsm);
	});

	it('initial state is Off', () => {
		expect(fsm.state).toBe(statesDictionary.Off);
	});

	it('initial lastAction is null', () => {
		expect(fsm.lastAction).toBeNull();
	});

	it('initial currentCycle is 0', () => {
		expect(fsm.currentCycle).toBe(0);
	});

	it('initial context has counter = null', () => {
		expect(fsm.getContext().context.counter).toBeNull();
	});

	it('dispatch transitions state from Off to Red', () => {
		fsm.dispatch({ action: actionsDictionary.Switch, payload: {} });
		expect(fsm.state).toBe(statesDictionary.Red);
	});

	it('dispatch updates lastAction', () => {
		fsm.dispatch({ action: actionsDictionary.Switch, payload: {} });
		expect(fsm.lastAction).toBe(actionsDictionary.Switch);
	});

	it('dispatch increments currentCycle', () => {
		fsm.dispatch({ action: actionsDictionary.Switch, payload: {} });
		expect(fsm.currentCycle).toBe(1);
	});

	it('counter increments on each dispatch', () => {
		fsm.dispatch({ action: actionsDictionary.Switch, payload: {} });
		fsm.dispatch({ action: actionsDictionary.Switch, payload: {} });
		expect(fsm.getContext().context.counter).toBe(2);
	});

	it('getContext returns state and context snapshot', () => {
		const ctx = fsm.getContext();
		expect(ctx).toHaveProperty('state');
		expect(ctx).toHaveProperty('context');
		expect(ctx.state).toBe(statesDictionary.Off);
	});

	it('multiple dispatches cycle through states', () => {
		const states = [statesDictionary.Red, statesDictionary.RedYellow, statesDictionary.Green, statesDictionary.Yellow, statesDictionary.Red];
		for (const expected of states) {
			fsm.dispatch({ action: actionsDictionary.Switch, payload: {} });
			expect(fsm.state).toBe(expected);
		}
	});

	it('unknown action does not change state', () => {
		const before = fsm.state;
		fsm.dispatch({ action: -999, payload: {} });
		expect(fsm.state).toBe(before);
	});

	describe('pause / resume', () => {
		it('paused machine queues dispatches', () => {
			fsm.pause();
			fsm.dispatch({ action: actionsDictionary.Switch, payload: {} });
			expect(fsm.state).toBe(statesDictionary.Off);
		});

		it('resume flushes queued dispatches', () => {
			fsm.pause();
			fsm.dispatch({ action: actionsDictionary.Switch, payload: {} });
			fsm.resume();
			expect(fsm.state).toBe(statesDictionary.Red);
		});
	});

	describe('disable / enable', () => {
		it('disabled machine ignores dispatches', () => {
			fsm.disable();
			fsm.dispatch({ action: actionsDictionary.Switch, payload: {} });
			expect(fsm.state).toBe(statesDictionary.Off);
		});

		it('enabled machine resumes accepting dispatches', () => {
			fsm.disable();
			fsm.enable();
			fsm.dispatch({ action: actionsDictionary.Switch, payload: {} });
			expect(fsm.state).toBe(statesDictionary.Red);
		});
	});

	it('destroy clears queue without throwing', () => {
		fsm.pause();
		fsm.dispatch({ action: actionsDictionary.Switch, payload: {} });
		expect(() => fsm.destroy()).not.toThrow();
	});
});

describe('pure-typescript codegen - .d.ts declarations', async () => {
	await generateAndSaveFiles(
		{ input: trafficInput, automataName: 'TrafficLightDTS', lang: ModuleNames.PureTypeScript },
		'pts_dts',
	);

	it('generates a .d.ts file', () => {
		const dtsPath = path.join(generatedDir, 'pts_dts', 'TrafficLightDTS.d.ts');
		expect(fs.existsSync(dtsPath)).toBe(true);
	});

	it('.d.ts exports statesDictionary', () => {
		const dts = fs.readFileSync(path.join(generatedDir, 'pts_dts', 'TrafficLightDTS.d.ts'), 'utf8');
		expect(dts).toContain('export declare const statesDictionary');
	});

	it('.d.ts exports actionsDictionary', () => {
		const dts = fs.readFileSync(path.join(generatedDir, 'pts_dts', 'TrafficLightDTS.d.ts'), 'utf8');
		expect(dts).toContain('export declare const actionsDictionary');
	});

	it('.d.ts exports factory function', () => {
		const dts = fs.readFileSync(path.join(generatedDir, 'pts_dts', 'TrafficLightDTS.d.ts'), 'utf8');
		expect(dts).toContain('export declare function createTrafficLightDTS');
	});

	it('.d.ts exports instance type', () => {
		const dts = fs.readFileSync(path.join(generatedDir, 'pts_dts', 'TrafficLightDTS.d.ts'), 'utf8');
		expect(dts).toContain('TTrafficLightDTSInstance');
	});

	it('.d.ts has default export', () => {
		const dts = fs.readFileSync(path.join(generatedDir, 'pts_dts', 'TrafficLightDTS.d.ts'), 'utf8');
		expect(dts).toContain('export default');
	});

	it('.d.ts exports helper functions', () => {
		const dts = fs.readFileSync(path.join(generatedDir, 'pts_dts', 'TrafficLightDTS.d.ts'), 'utf8');
		expect(dts).toContain('export declare function getState');
		expect(dts).toContain('export declare function getAction');
		expect(dts).toContain('export declare function createAction');
		expect(dts).toContain('export declare function hasState');
	});

	it('.d.ts exports createEventBus', () => {
		const dts = fs.readFileSync(path.join(generatedDir, 'pts_dts', 'TrafficLightDTS.d.ts'), 'utf8');
		expect(dts).toContain('export declare function createEventBus');
	});
});

describe('pure-typescript codegen - module-level exports', async () => {
	await generateAndSave(
		{ input: trafficInput, automataName: 'TrafficLightTSExports', lang: ModuleNames.PureTypeScript },
		'pts_exports',
	);

	const mod = await import(`./fixtures/generated/pts_exports_generated.js`);

	it('exports statesDictionary', () => {
		expect(mod.statesDictionary).toBeDefined();
		expect(typeof mod.statesDictionary).toBe('object');
	});

	it('exports actionsDictionary', () => {
		expect(mod.actionsDictionary).toBeDefined();
		expect(typeof mod.actionsDictionary).toBe('object');
	});

	it('exports eventDictionary', () => {
		expect(mod.eventDictionary).toBeDefined();
	});

	it('exports getState helper', () => {
		expect(typeof mod.getState).toBe('function');
		expect(mod.getState('Off')).toBe(mod.statesDictionary.Off);
	});

	it('exports getAction helper', () => {
		expect(typeof mod.getAction).toBe('function');
		expect(mod.getAction('Switch')).toBe(mod.actionsDictionary.Switch);
	});

	it('exports createAction helper', () => {
		expect(typeof mod.createAction).toBe('function');
		const ap = mod.createAction('Switch', {});
		expect(ap).toEqual({ action: mod.actionsDictionary.Switch, payload: {} });
	});

	it('exports hasState helper', () => {
		expect(typeof mod.hasState).toBe('function');
		const fsm = mod.createTrafficLightTSExports();
		expect(mod.hasState(fsm, 'Off')).toBe(true);
	});

	it('exports createEventBus function', () => {
		expect(typeof mod.createEventBus).toBe('function');
	});

	it('factory function is default export', () => {
		expect(typeof mod.default).toBe('function');
	});
});

describe('pure-typescript codegen - forks', async () => {
	const forksInput = `stateDiagram-v2
	Check --> High: Eval [isGreater($score, 50)]
	Check --> Low: Eval
note left of Check
+Init
end note
`;
	await generateAndSave(
		{ input: forksInput, automataName: 'PTSForksTest', lang: ModuleNames.PureTypeScript },
		'pts_forks',
	);
	const { createPTSForksTest, statesDictionary: forksStates, actionsDictionary: forksActions } = await import(
		`./fixtures/generated/pts_forks_generated.js`,
	);

	it('score > 50 routes to High', () => {
		const fsm = createPTSForksTest();
		fsm.dispatch({ action: forksActions.Eval, payload: { score: 80 } });
		expect(fsm.state).toBe(forksStates.High);
	});

	it('score <= 50 routes to Low', () => {
		const fsm = createPTSForksTest();
		fsm.dispatch({ action: forksActions.Eval, payload: { score: 30 } });
		expect(fsm.state).toBe(forksStates.Low);
	});

	it('score exactly 50 routes to Low', () => {
		const fsm = createPTSForksTest();
		fsm.dispatch({ action: forksActions.Eval, payload: { score: 50 } });
		expect(fsm.state).toBe(forksStates.Low);
	});
});

describe('pure-typescript codegen - subscribe via EventBus', async () => {
	const subscriberInput = `stateDiagram-v2
	[*] --> INIT
	INIT --> EVENT_RECEIVED: RESPOND_TO_EVENT
note right of INIT
+Init
subscribe/specialEvent RESPOND_TO_EVENT
end note
`;
	await generateAndSave(
		{ input: subscriberInput, automataName: 'PTSSubscribeTest', lang: ModuleNames.PureTypeScript },
		'pts_subscribe',
	);
	const subMod = await import(`./fixtures/generated/pts_subscribe_generated.js`);
	const { createPTSSubscribeTest, createEventBus: createSubBus, eventDictionary: subEvents, statesDictionary: subStates } = subMod;

	it('createEventBus returns [EventBus, automatas, cleanup] tuple', () => {
		const result = createSubBus('t1', { sub: createPTSSubscribeTest });
		expect(Array.isArray(result)).toBe(true);
		expect(result).toHaveLength(3);
		const [EventBus, automatas, cleanup] = result;
		expect(typeof EventBus.dispatch).toBe('function');
		expect(typeof EventBus.subscribe).toBe('function');
		expect(typeof EventBus.getEventStack).toBe('function');
		expect(automatas.sub).toBeDefined();
		expect(typeof cleanup).toBe('function');
	});

	it('subscribe transitions FSM on EventBus.dispatch', () => {
		const [EventBus, automatas] = createSubBus('t2', { sub: createPTSSubscribeTest });
		expect(automatas.sub.state).toBe(subStates.INIT);
		EventBus.dispatch({ event: subEvents.specialEvent, meta: {} });
		expect(automatas.sub.state).toBe(subStates.EVENT_RECEIVED);
	});

	it('getEventStack records dispatched events', () => {
		const [EventBus] = createSubBus('t3', { sub: createPTSSubscribeTest });
		EventBus.dispatch({ event: subEvents.specialEvent, meta: {} });
		expect(EventBus.getEventStack().length).toBeGreaterThan(0);
	});
});

describe('pure-typescript codegen - emit via EventBus', async () => {
	const emitterInput = `stateDiagram-v2
	[*] --> INIT
	INIT --> EMIT_TRIGGER: RESPOND_TO_EVENT
note right of INIT
+Init
subscribe/eventFromBus RESPOND_TO_EVENT
end note
note right of EMIT_TRIGGER
emit/specialEvent
end note
`;
	await generateAndSave(
		{ input: emitterInput, automataName: 'PTSEmitTest', lang: ModuleNames.PureTypeScript },
		'pts_emit',
	);
	const emitMod = await import(`./fixtures/generated/pts_emit_generated.js`);
	const { createPTSEmitTest, createEventBus: createEmitBus, eventDictionary: emitEvents, statesDictionary: emitStates } = emitMod;

	it('emitter transitions to EMIT_TRIGGER on subscribed event', () => {
		const [EventBus, automatas] = createEmitBus('t4', { emit: createPTSEmitTest });
		EventBus.dispatch({ event: emitEvents.eventFromBus, meta: {} });
		expect(automatas.emit.state).toBe(emitStates.EMIT_TRIGGER);
	});

	it('emit dispatches specialEvent back to EventBus', () => {
		const [EventBus] = createEmitBus('t5', { emit: createPTSEmitTest });
		const received: unknown[] = [];
		EventBus.subscribe(emitEvents.specialEvent, (ev: unknown) => received.push(ev));
		EventBus.dispatch({ event: emitEvents.eventFromBus, meta: {} });
		expect(received.length).toBeGreaterThan(0);
	});
});

describe('pure-typescript codegen - epoch tracking', async () => {
	const epochMod = await import(`./fixtures/generated/pts_traffic_generated.js`);

	it('exports getEpoch function', () => {
		expect(typeof epochMod.getEpoch).toBe('function');
	});

	it('epoch increments on each successful dispatch', () => {
		const before = epochMod.getEpoch();
		const fsm = epochMod.createTrafficLightTS();
		fsm.dispatch({ action: epochMod.actionsDictionary.Switch, payload: {} });
		expect(epochMod.getEpoch()).toBe(before + 1);
	});

	it('epoch is shared across instances from same module', () => {
		const before = epochMod.getEpoch();
		const fsm1 = epochMod.createTrafficLightTS();
		const fsm2 = epochMod.createTrafficLightTS();
		fsm1.dispatch({ action: epochMod.actionsDictionary.Switch, payload: {} });
		fsm2.dispatch({ action: epochMod.actionsDictionary.Switch, payload: {} });
		expect(epochMod.getEpoch()).toBe(before + 2);
	});

	it('unknown action does not increment epoch', () => {
		const before = epochMod.getEpoch();
		const fsm = epochMod.createTrafficLightTS();
		fsm.dispatch({ action: -999, payload: {} });
		expect(epochMod.getEpoch()).toBe(before);
	});
});

describe('pure-typescript codegen - internals in context', async () => {
	const internalsInput = `stateDiagram-v2
	[*] --> A: go
	A --> B: step
	B --> A: step
note left of A
	+Init
	#{ cycle = 0 } <= _currentCycle()
end note
note left of B
	#{ cycle = 0 } <= _currentCycle()
end note
`;
	await generateAndSave(
		{ input: internalsInput, automataName: 'PTSInternalsTest', lang: ModuleNames.PureTypeScript },
		'pts_internals',
	);
	const { createPTSInternalsTest, actionsDictionary: intActions } = await import(
		`./fixtures/generated/pts_internals_generated.js`
	);

	it('context.cycle reflects pre-dispatch cycle (currentCycle - 1)', () => {
		const fsm = createPTSInternalsTest();
		fsm.dispatch({ action: intActions.step, payload: {} });
		expect(fsm.getContext().context.cycle).toBe(fsm.currentCycle - 1);
	});

	it('context.cycle increments on each successful dispatch', () => {
		const fsm = createPTSInternalsTest();
		fsm.dispatch({ action: intActions.step, payload: {} });
		const after1 = fsm.getContext().context.cycle;
		fsm.dispatch({ action: intActions.step, payload: {} });
		const after2 = fsm.getContext().context.cycle;
		expect(after2).toBe(after1 + 1);
	});

	it('context.cycle does not change on impossible action', () => {
		const fsm = createPTSInternalsTest();
		fsm.dispatch({ action: intActions.step, payload: {} });
		const before = fsm.getContext().context.cycle;
		fsm.dispatch({ action: -999, payload: {} });
		expect(fsm.getContext().context.cycle).toBe(before);
	});
});
