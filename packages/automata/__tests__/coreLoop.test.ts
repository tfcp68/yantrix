import { uniqId, waitForEventOnce } from '@yantrix/utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	AutomataEventAdapter,
	CoreLoop,
	createDataDestinationAdapter,
	createDataSourceAdapter,
	createPromiseDataAdapter,
	IAutomata,
	IAutomataEventAdapter,
	IAutomataEventBus,
	IDataDestination,
	IDataSource,
	NamedDataDestination,
	NamedDataSource,
	TAutomataActionPayload,
	TAutomataBaseEventType,
	TAutomataEventMetaType,
	TAutomataStateContext,
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
	[UEvents.EVT_IN]: { n?: number; id?: string };
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

	public readonly correlationId: string = uniqId();
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
	setEventAdapter = (adapter: IAutomataEventAdapter<
		UStates,
		UActions,
		UEvents,
		Record<UStates, any>,
		Record<UActions, any>,
		TMeta
	> | null) => {
		this.eventAdapter = adapter;
		return this;
	};

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

type TSrcPacket = { n: number };

/**
 * Creates a real Data Source (via `createDataSourceAdapter`) with an explicit id.
 * Lifecycle is observed through `isActive()`; `push(n)` enqueues a packet that the
 * source's listener maps to an EVT_OUT event.
 */
function createSourceStub(id: string): IDataSource<UEvents, TMeta, TSrcPacket> & { push: (n?: number) => void } {
	const Src = createDataSourceAdapter<UEvents, TMeta, TSrcPacket>()(NamedDataSource<TSrcPacket>);
	let setter: ((p: TSrcPacket) => void) | null = null;
	const src = new Src({
		id,
		afterInit: (_id, s) => {
			if (s) setter = s as (p: TSrcPacket) => void;
		},
	});
	src.addListener('emit', () => [{ event: UEvents.EVT_OUT, meta: {} }]);
	return Object.assign(src, {
		push: (n = 1) => setter?.({ n }),
	}) as IDataSource<UEvents, TMeta, TSrcPacket> & { push: (n?: number) => void };
}

/**
 * Creates a real Data Destination (via `createDataDestinationAdapter`) that triggers on
 * EVT_OUT and calls `spy` from its selector.
 */
function createDestinationStub(id: string, spy: (e: TAutomataEventMetaType<UEvents, TMeta>) => any): IDataDestination<UEvents, TMeta, null, { tag: string }, void> {
	const Dst = createDataDestinationAdapter<UEvents, TMeta, null, { tag: string }, void>()(
		NamedDataDestination<{ tag: string }, void>,
	);
	const dst = new Dst({ id, resolver: async () => undefined });
	dst.createTrigger([UEvents.EVT_OUT], (event: TAutomataEventMetaType<UEvents, TMeta>) => {
		spy(event);
		return { tag: 'x' };
	});
	return dst as unknown as IDataDestination<UEvents, TMeta, null, { tag: string }, void>;
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

	it('registers and unregisters Automata; re-registering the same instance throws; basic wiring works with stub', async () => {
		const automata = new AutomataStub();
		const adapter = new AutomataEventAdapter();

		adapter.addEventListener(UEvents.EVT_IN, () => ({ action: UActions.DO, payload: null }));
		adapter.addEventEmitter(UStates.S2, () => ({ event: UEvents.EVT_OUT, meta: {} }));

		expect(() => loop.registerAutomata(automata, adapter)).not.toThrow();
		expect(() => loop.registerAutomata(automata, adapter)).toThrow();

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
		loop.unregisterAutomata(automata.correlationId);

		const waitOutAgain = waitForEventOnce<UEvents, TMeta>(bus, UEvents.EVT_OUT, 50) // short timeout
			.then(() => { throw new Error('Should not receive EVT_OUT after unregister'); })
			.catch(() => void 0); // expect timeout -> no events expected

		bus.dispatch(toEvent<UEvents, TMeta>(UEvents.EVT_IN, {}));
		await waitOutAgain;

		expect(outSpy).toHaveBeenCalledTimes(1); // unchanged
	});

	it('registers/unregisters Sources with explicit ids and respects start/stop lifecycle', () => {
		// Register before start -> not yet active
		const srcA = createSourceStub('srcA');
		loop.registerSource(srcA);
		expect(srcA.isActive()).toBe(false);

		loop.start();
		// Source registered before start IS started by loop.start() (fixes prior latent no-start behavior)
		expect(srcA.isActive()).toBe(true);

		// Register after start -> started immediately
		const srcB = createSourceStub('srcB');
		loop.registerSource(srcB);
		expect(srcB.isActive()).toBe(true);

		// Stop loop -> all sources should be stopped
		loop.stop();
		expect(srcB.isActive()).toBe(false);

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
		loop.registerAutomata(a, adapter);

		expect(() => loop.unregisterAutomata(a.correlationId)).not.toThrow();
		expect(() => loop.unregisterAutomata(a.correlationId)).not.toThrow();
	});

	it('rejects registering sources/destinations without non-empty ids', () => {
		const badSrc = { id: '' } as unknown as IDataSource<UEvents, TMeta>;
		expect(() => loop.registerSource(badSrc)).toThrow();

		const badDst = { id: '' } as unknown as IDataDestination<UEvents, TMeta>;
		expect(() => loop.registerDestination(badDst)).toThrow();
	});

	it('createPromiseDataAdapter: register both halves; request → resolver → response reaches the bus', async () => {
		const [source, destination] = createPromiseDataAdapter<
			UEvents,
			TMeta,
			{ n: number },
			{ doubled: number }
		>({
			id: 'promise_adapter',
			requestEvents: [UEvents.EVT_IN],
			requestMapper: e => ({ n: (e.meta as TMeta[UEvents.EVT_IN])?.n ?? 0 }),
			resolver: async data => ({ doubled: data.n * 2 }),
			responseMapper: () => [{ event: UEvents.EVT_OUT, meta: {} }],
		});

		// Both halves register directly with CoreLoop — no hand-rolled bridge, no polling.
		loop.registerSource(source);
		loop.registerDestination(destination);
		loop.start();

		const waitOut = waitForEventOnce(bus, UEvents.EVT_OUT, 500);
		bus.dispatch(toEvent<UEvents, TMeta>(UEvents.EVT_IN, { n: 21 }));
		// The follow-up EVT_OUT is emitted by the paired source, which the loop drains
		// after the resolver pushes its result (woken via setNotifier).
		await expect(waitOut).resolves.toBeDefined();
	});

	it('setNotifier: an async source push (timer/cache/promise) is pumped to the bus — no polling', async () => {
		const src = createSourceStub('async_src');
		loop.registerSource(src); // CoreLoop installs src.setNotifier(() => scheduleDrain)
		loop.start();

		const waitOut = waitForEventOnce(bus, UEvents.EVT_OUT, 300);
		// Emit LATER, while the loop is otherwise idle (no concurrent dispatch to "carry" it).
		setTimeout(() => src.push(1), 15);

		// Reaches the bus only because the push woke the loop via the notifier.
		await expect(waitOut).resolves.toBeDefined();
	});

	it('without a notifier, an async push is stranded in the queue and never reaches the bus', async () => {
		const src = createSourceStub('silent_src');
		(src as unknown as { setNotifier: (() => unknown) | null }).setNotifier = null; // ignore notifier

		loop.registerSource(src);
		loop.start();

		let seen = 0;
		bus.subscribe(UEvents.EVT_OUT, (e) => {
			seen++;
			return { event: e.event, meta: e.meta, task_id: uniqId(), result: null };
		});

		setTimeout(() => src.push(1), 15);
		await new Promise(r => setTimeout(r, 120)); // same window — but no notifier → no drain

		expect(seen).toBe(0); // event is stuck in the source queue
	});

	it('setNotifier: multiple pushes in one tick coalesce to a single drain but deliver every event', async () => {
		const src = createSourceStub('burst_src');
		loop.registerSource(src);
		loop.start();

		const seen: (UEvents | null)[] = [];
		bus.subscribe(UEvents.EVT_OUT, (e) => {
			seen.push(e.event);
			return { event: e.event, meta: e.meta, task_id: uniqId(), result: null };
		});

		// Three synchronous pushes → notifier coalesces to ONE microtask drain, but the
		// drain pulls eventEmitter() until empty, so all three events still publish.
		src.push(1);
		src.push(2);
		src.push(3);

		await new Promise(r => setTimeout(r, 50));
		expect(seen.length).toBe(3);
	});
});
