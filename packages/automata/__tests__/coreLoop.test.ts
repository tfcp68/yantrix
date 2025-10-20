import { uniqId, waitForEventOnce } from '@yantrix/utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	AutomataEventAdapter,
	CoreLoop,
	IAutomata,
	IAutomataEventAdapter,
	IAutomataEventBus,
	IEventDestination,
	IEventSource,
	TAutomataActionPayload,
	TAutomataBaseEventType,
	TAutomataEventMetaType,
	TAutomataStateContext,
	TEventBusTask,
} from '../../automata/src';

/**
 * Minimal event set for unit tests
 */
enum UEvents {
	EVT_IN = 1,
	EVT_OUT = 2,
}

/**
 * Minimal states/actions for stub automata
 */
enum UStates {
	S1 = 10,
	S2 = 11,
}
enum UActions {
	DO = 100,
}

/**
 * Event meta contract for unit tests
 */
type TMeta = {
	[UEvents.EVT_IN]: { n?: number };
	[UEvents.EVT_OUT]: object;
};

/**
 * Helper to form a typed EventBus event
 */
function toEvent<E extends TAutomataBaseEventType, M extends { [K in E]: any }>(
	event: E,
	meta: M[E],
): TAutomataEventMetaType<E, M> {
	return { event, meta };
}

/**
 * A lightweight stub of IAutomata that implements only what's needed by CoreLoop.
 * - Stores current state/context
 * - Records last dispatched action
 * - Returns context from getContext()
 * - Exposes lax validators
 */
class AutomataStub
implements IAutomata<
	UStates,
	UActions,
	UEvents,
	Record<UStates, any>,
	Record<UActions, any>,
	TMeta
> {
	public eventAdapter: IAutomataEventAdapter<
		UStates,
		UActions,
		UEvents,
		Record<UStates, any>,
		Record<UActions, any>,
		TMeta
	> | null = null;

	public state: UStates | null = UStates.S1;
	public context: Record<UStates, any>[UStates] | null = { value: 0 };
	public lastAction: UActions | null = null;

	validateEvent = ((x: any) => typeof x === 'number') as any;
	setEventValidator = (() => this) as any;
	validateState = ((x: any) => typeof x === 'number') as any;
	setStateValidator = (() => this) as any;
	validateAction = ((x: any) => typeof x === 'number') as any;
	setActionValidator = (() => this) as any;
	validateContext = ((_: any) => true) as any;
	setContextValidator = (() => this) as any;
	validateEventMeta = ((_: any) => true) as any;
	setEventMetaValidator = (() => this) as any;

	enable = () => this;
	disable = () => this;
	isEnabled = () => true;
	isPaused = () => false;
	pause = () => this;
	resume = () => this;

	init = (() => this) as any;
	getReducer = () => null;

	getContext<K extends UStates = UStates>(): TAutomataStateContext<K, Record<UStates, any>> {
		return {
			state: this.state as K,
			context: this.context,
		};
	}

	collapseActionQueue() {
		return { actions: [], newState: this.getContext() };
	}

	getActionQueue() {
		return [];
	}

	clearActionQueue() {
		return this;
	}

	consumeAction() {
		return { action: null, newState: this.getContext() };
	}

	// Dispatch transitions S1 -> S2 and store last action
	dispatch(action: TAutomataActionPayload<UActions, Record<UActions, any>>): TAutomataStateContext<UStates, Record<UStates, any>> {
		this.lastAction = action.action;
		// Simulate a transition for wiring tests
		this.state = UStates.S2;
		// CoreLoop calls adapter.handleTransition(getContext()) after this
		return this.getContext();
	}
}

/**
 * Creates a simple Source stub with explicit id and observable started flag.
 */
function createSourceStub(id: string, onStart?: (publish: (e: TAutomataEventMetaType<UEvents, TMeta>) => void) => void): IEventSource<UEvents, TMeta> & { started: boolean } {
	let started = false;
	return {
		id,
		get started() {
			return started;
		},
		start: (publish) => {
			started = true;
			if (onStart) onStart(publish);
		},
		stop: () => {
			started = false;
		},
	};
}

/**
 * Creates a simple Destination stub that subscribes to EVT_OUT and calls spy.
 */
function createDestinationStub(id: string, spy: (e: TAutomataEventMetaType<UEvents, TMeta>) => any): IEventDestination<UEvents, TMeta> {
	return {
		id,
		bind: (bus: IAutomataEventBus<UEvents, TMeta>) => {
			const handler = (e: TAutomataEventMetaType<UEvents, TMeta>): TEventBusTask<UEvents, TMeta> => {
				spy(e);
				return { event: e.event, meta: e.meta, task_id: uniqId(), result: null };
			};
			bus.subscribe(UEvents.EVT_OUT, handler);
			return () => bus.unsubscribe(UEvents.EVT_OUT, handler);
		},
	};
}

describe('coreLoop unit tests (with stubbed Automata)', () => {
	let loop: CoreLoop<UEvents, TMeta>;
	let bus: IAutomataEventBus<UEvents, TMeta>;

	beforeEach(() => {
		loop = new CoreLoop<UEvents, TMeta>();
		bus = loop.getBus();
	});

	it('start/stop toggles EventBus running flag and is idempotent', () => {
		expect(bus.isRunning()).toBe(true);

		// idempotent start
		expect(() => loop.start()).not.toThrow();
		expect(bus.isRunning()).toBe(true);

		loop.stop();
		expect(bus.isRunning()).toBe(false);

		// idempotent stop
		expect(() => loop.stop()).not.toThrow();
		expect(bus.isRunning()).toBe(false);
	});

	it('registers and unregisters Automata; duplicate ids throw; basic wiring works with stub', async () => {
		const automata = new AutomataStub();
		const adapter = new AutomataEventAdapter();

		adapter.addEventListener(UEvents.EVT_IN, () => ({ action: UActions.DO, payload: null }));
		adapter.addEventEmitter(UStates.S2, () => ({ event: UEvents.EVT_OUT, meta: {} }));

		const idAutomata = uniqId();
		expect(() => loop.registerAutomata(idAutomata, automata, adapter)).not.toThrow();
		expect(() => loop.registerAutomata(idAutomata, automata, adapter)).toThrow();

		const outSpy = vi.fn((e: TAutomataEventMetaType<UEvents, TMeta>) => ({
			event: e.event,
			meta: e.meta,
			task_id: uniqId(),
			result: null,
		}));
		bus.subscribe(UEvents.EVT_OUT, outSpy as any);

		// Trigger an input event and wait until EVT_OUT is published
		const waitOut = waitForEventOnce(bus, UEvents.EVT_OUT, 200);
		bus.dispatch(toEvent<UEvents, TMeta>(UEvents.EVT_IN, {}));
		await waitOut; // ensure EVT_OUT has been published

		expect(automata.lastAction).toBe(UActions.DO);
		expect(outSpy).toHaveBeenCalledTimes(1);
		expect(outSpy.mock.calls[0]![0]).toEqual(expect.objectContaining({ event: UEvents.EVT_OUT }));

		// Unregister and verify no more publications
		loop.unregisterAutomata(idAutomata);

		const waitOutAgain = waitForEventOnce<UEvents, TMeta>(bus, UEvents.EVT_OUT, 50) // short timeout
			.then(() => { throw new Error('Should not receive EVT_OUT after unregister'); })
			.catch(() => void 0); // expect timeout -> no events expected

		bus.dispatch(toEvent<UEvents, TMeta>(UEvents.EVT_IN, {}));
		await waitOutAgain;

		expect(outSpy).toHaveBeenCalledTimes(1); // unchanged
	});

	it('registers/unregisters Sources with explicit ids and respects start/stop lifecycle', () => {
		// Register before start -> should NOT be auto-started per contract
		const srcA = createSourceStub('srcA');
		loop.registerSource(srcA);
		expect(srcA.started).toBe(false);

		loop.start();
		// Source registered before start is not auto-started
		expect(srcA.started).toBe(false);

		// Register after start -> started immediately
		const srcB = createSourceStub('srcB');
		loop.registerSource(srcB);
		expect(srcB.started).toBe(true);

		// Stop loop -> all sources should be stopped
		loop.stop();
		expect(srcB.started).toBe(false);

		// Duplicate id should throw
		loop.start();
		const srcC = createSourceStub('srcC');
		loop.registerSource(srcC);
		expect(() => loop.registerSource(srcC)).toThrow();

		// Unregister is safe and idempotent
		expect(() => loop.unregisterSource('srcC')).not.toThrow();
		expect(() => loop.unregisterSource('srcC')).not.toThrow();
	});

	it('registers/unregisters Destinations and unsubscribes handlers on unregister/stop', async () => {
		const spy = vi.fn();
		const destinationId = uniqId();
		const dst = createDestinationStub(destinationId, spy);

		loop.registerDestination(dst);
		loop.start();

		// First event arrives (await bus processing)
		const firstEvt = waitForEventOnce(bus, UEvents.EVT_OUT, 200);
		bus.dispatch(toEvent<UEvents, TMeta>(UEvents.EVT_OUT, {}));
		await firstEvt;
		expect(spy).toHaveBeenCalledTimes(1);

		// Unregister and ensure no more events are delivered
		loop.unregisterDestination(destinationId);
		const shouldTimeoutAfterUnregister = waitForEventOnce(bus, UEvents.EVT_OUT, 50)
			.then(() => {
				throw new Error('Should not receive EVT_OUT after unregister');
			})
			.catch(() => void 0); // expected timeout -> no event
		bus.dispatch(toEvent<UEvents, TMeta>(UEvents.EVT_OUT, {}));
		await shouldTimeoutAfterUnregister;
		expect(spy).toHaveBeenCalledTimes(1);

		// Register again and verify stop() unbinds
		loop.registerDestination(dst);
		const secondEvt = waitForEventOnce(bus, UEvents.EVT_OUT, 200);
		bus.dispatch(toEvent<UEvents, TMeta>(UEvents.EVT_OUT, {}));
		await secondEvt;
		expect(spy).toHaveBeenCalledTimes(2);

		loop.stop();

		const shouldTimeoutAfterStop = waitForEventOnce(bus, UEvents.EVT_OUT, 50)
			.then(() => {
				throw new Error('Should not receive EVT_OUT after stop');
			})
			.catch(() => void 0); // expected timeout -> no event
		bus.dispatch(toEvent<UEvents, TMeta>(UEvents.EVT_OUT, {}));
		await shouldTimeoutAfterStop;
		expect(spy).toHaveBeenCalledTimes(2);

		bus.clearEventStack();

		loop.start();
		expect(() => loop.registerDestination(dst)).toThrow();

		// Unregister is idempotent
		expect(() => loop.unregisterDestination(destinationId)).not.toThrow();
		expect(() => loop.unregisterDestination(destinationId)).not.toThrow();
	});

	it('unregisterAutomata is safe to call twice', () => {
		const a = new AutomataStub();
		const adapter = new AutomataEventAdapter();
		const automataId = uniqId();
		loop.registerAutomata(automataId, a, adapter);

		expect(() => loop.unregisterAutomata(automataId)).not.toThrow();
		expect(() => loop.unregisterAutomata(automataId)).not.toThrow();
	});

	it('rejects registering sources/destinations without non-empty ids', () => {
		const badSrc = { id: '', start: () => {}, stop: () => {} } as unknown as IEventSource<UEvents, TMeta>;
		expect(() => loop.registerSource(badSrc)).toThrow();

		const badDst = { id: '', bind: () => () => {} } as unknown as IEventDestination<UEvents, TMeta>;
		expect(() => loop.registerDestination(badDst)).toThrow();
	});
});
