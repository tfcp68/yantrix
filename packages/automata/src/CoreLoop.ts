import AutomataEventAdapter from './EventAdapter';
import BasicEventBus from './EventBus';
import {
	TAutomataBaseActionType,
	TAutomataBaseEventType,
	TAutomataBaseStateType,
	TAutomataEventMetaType,
	TAutomataEventStack,
	TEffectFlushResult,
} from './types';
import {
	IAutomata,
	IAutomataEventAdapter,
	IAutomataEventBus,
	IAutomataSlice,
	IDataDestination,
	IDataSource,
	IEffectScheduler,
} from './types/interfaces';

type TUnsub = () => void;

type TRegisteredAutomata = {
	id: string;
	unsubs: TUnsub[];
};

type TRegisteredDestination = {
	id: string;
	boundEvents: Array<number | null>;
	update: (event: TAutomataEventMetaType<number, Record<number, any>>, model?: object) => void;
	subscribe: () => void;
	unsubscribe: () => void;
	start: () => void;
	stop: () => void;
};

type TRegisteredSlice<EventType extends TAutomataBaseEventType, EventMetaType extends { [K in EventType]: any }> = {
	id: string;
	slice: IAutomataSlice<EventType, EventMetaType, any>;
	machineIds: string[];
	removeEffectMatrix: TUnsub;
};

/** Constructor props for {@link CoreLoop}. Subclasses extend this (e.g. {@link TimedCoreLoop}). */
export type TCoreLoopProps<
	EventType extends TAutomataBaseEventType = TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
	ModelType extends object = Record<string, any>,
> = {
	bus?: IAutomataEventBus<EventType, EventMetaType>;
	effectScheduler?: IEffectScheduler<ModelType, EventType, EventMetaType>;
};

/**
 * CoreLoop is the main loop that connects:
 * - an Event Bus (pub/sub for Events),
 * - one or more FSMs (IAutomata) through an Event Adapter,
 * - Sources (`IDataSource`, producers of Events),
 * - Destinations (`IDataDestination`, consumers of Events).
 *
 * Driver-agnostic: the loop only knows how to drain Sources on a `tick()`. *When* to tick is left to a
 * driver — call `tick()` manually, from a reactive observer, or use {@link TimedCoreLoop} for a clock.
 *
 * Generics:
 * - EventType: enum/number of Events
 * - EventMetaType: a map EventType -> meta payload shape
 */
export class CoreLoop<
	EventType extends TAutomataBaseEventType = TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
	ModelType extends object = Record<string, any>,
> {
	/** Hard cap on the per-drain pull loop; protects against a misbehaving source generator. */
	private static readonly DRAIN_GUARD = 10_000;

	private readonly bus: IAutomataEventBus<EventType, EventMetaType>;
	private readonly effectScheduler: IEffectScheduler<ModelType, EventType, EventMetaType> | null;
	private pendingEffectEvents: TAutomataEventStack<EventType, EventMetaType> = [];
	private effectFlushScheduled = false;
	private effectFlushPromise: Promise<void> | null = null;
	private readonly automata: Map<string, TRegisteredAutomata> = new Map();
	private readonly destinations: Map<string, TRegisteredDestination> = new Map();
	private readonly slices: Map<string, TRegisteredSlice<EventType, EventMetaType>> = new Map();
	private readonly sources: Map<string, {
		id: string;
		src: IDataSource<EventType, EventMetaType, any>;
		start: () => void;
		stop: () => void;
	}> = new Map();

	private started = false;

	protected readonly publishToBus = (
		event: TAutomataEventMetaType<EventType, EventMetaType>,
	): void => {
		this.bus.dispatch(event);
	};

	constructor(props: TCoreLoopProps<EventType, EventMetaType, ModelType> = {}) {
		this.bus = (props.bus ?? (new BasicEventBus() as unknown as IAutomataEventBus<EventType, EventMetaType>));
		this.effectScheduler = props.effectScheduler ?? null;
	}

	public getBus(): IAutomataEventBus<EventType, EventMetaType> {
		return this.bus;
	}

	public getEffectScheduler(): IEffectScheduler<ModelType, EventType, EventMetaType> | null {
		return this.effectScheduler;
	}

	/** Resolves after the Event cascade and its Effect batch have both completed. */
	public async whenIdle(): Promise<void> {
		await this.bus.whenIdle();
		const flushPromise = this.effectFlushPromise;
		if (!flushPromise) return;
		try {
			await flushPromise;
		} finally {
			if (this.effectFlushPromise === flushPromise) this.effectFlushPromise = null;
		}
	}

	private enqueueEffectEvent(event: TAutomataEventMetaType<EventType, EventMetaType>): void {
		if (!this.effectScheduler) return;

		this.effectScheduler.enqueue(event);
		this.pendingEffectEvents.push(event);
		if (this.effectFlushScheduled) return;

		this.effectFlushScheduled = true;
		this.effectFlushPromise = this.bus.whenIdle().then(() => {
			this.flushEffects();
		});
		// Keep automatic Effect errors observable through CoreLoop.whenIdle while
		// preventing an unhandled rejection when the loop is used reactively.
		void this.effectFlushPromise.catch(() => {});
	}

	private flushEffects(): TEffectFlushResult<ModelType> | null {
		if (!this.effectScheduler) return null;

		this.effectFlushScheduled = false;
		const events = this.pendingEffectEvents;
		this.pendingEffectEvents = [];
		const result = this.effectScheduler.flush();

		if (result.changed) {
			for (const destination of this.destinations.values()) {
				for (const event of events) {
					if (destination.boundEvents.some(boundEvent => boundEvent === null || boundEvent === event.event)) {
						destination.update(event, result.model);
					}
				}
			}
		}

		return result;
	}

	/** Registers a Slice's machines and Effect Matrix as one composition unit. */
	public registerSlice(slice: IAutomataSlice<EventType, EventMetaType, ModelType>): this {
		if (!this.effectScheduler) throw new Error('CoreLoop requires an Effect Scheduler to register a Slice');
		if (!slice.id) throw new Error('Slice must provide a non-empty string id');
		if (this.slices.has(slice.id)) throw new Error(`Slice with id "${slice.id}" already registered`);

		const machineIds: string[] = [];
		let removeEffectMatrix: TUnsub = () => {};
		try {
			for (const machine of Object.values(slice.getMachines())) {
				this.registerAutomata(machine);
				machineIds.push(machine.correlationId);
			}
			removeEffectMatrix = this.effectScheduler.addMatrix(slice.getEventMatrix());
			slice.start();
			this.slices.set(slice.id, { id: slice.id, slice, machineIds, removeEffectMatrix });
		} catch (error) {
			for (const machineId of machineIds) this.unregisterAutomata(machineId);
			removeEffectMatrix();
			throw error;
		}

		return this;
	}

	/** Removes a Slice's machines and Effect Matrix together. */
	public unregisterSlice(id: string): this {
		const registered = this.slices.get(id);
		if (!registered) return this;

		for (const machineId of registered.machineIds) this.unregisterAutomata(machineId);
		registered.removeEffectMatrix();
		registered.slice.stop(false);
		this.slices.delete(id);
		return this;
	}

	/**
	 * Registers an automata and wires data flow:
	 * - Event Bus -> Event Adapter -> Actions -> dispatch to the Automata
	 * - FSM transitions -> Event Adapter -> Events -> Event Bus (via EventBus-aware adapter)
	 *
	 * Assumptions:
	 * - The adapter is already configured with addEventListener(...) and addEventEmitter(...) mappings.
	 *
	 * @template StateType Automata state enum (number)
	 * @template ActionType Automata action enum (number)
	 * @template ContextType State -> Context mapping
	 * @template PayloadType Action -> Payload mapping
	 * @param machine Automata instance to register; keyed by its own correlationId
	 * @param adapter Optional AutomataEventAdapter; created if not provided
	 * @throws Error when the same automata instance is already registered
	 * @returns This CoreLoop instance (for chaining)
	 */
	public registerAutomata<
		StateType extends TAutomataBaseStateType,
		ActionType extends TAutomataBaseActionType,
		ContextType extends { [K in StateType]: any } = Record<StateType, any>,
		PayloadType extends { [K in ActionType]: any } = Record<ActionType, any>,
	>(
		machine: IAutomata<StateType, ActionType, EventType, ContextType, PayloadType, EventMetaType>,
		adapter?: IAutomataEventAdapter<StateType, ActionType, EventType, ContextType, PayloadType, EventMetaType>,
	): this {
		const id = machine.correlationId;
		if (this.automata.has(id)) throw new Error(`Automata with id "${id}" already registered`);

		const bridge
			= adapter
			?? machine.eventAdapter
			?? (new AutomataEventAdapter() as unknown as IAutomataEventAdapter<
				StateType,
				ActionType,
				EventType,
				ContextType,
				PayloadType,
				EventMetaType
			>);

		machine.setEventAdapter(bridge);

		// Subscribe to the Event Bus for events observed by the adapter
		const observed = bridge.getObservedEvents();
		const unsubs: TUnsub[] = [];

		for (const evt of observed) {
			const handler = ({ event, meta }: TAutomataEventMetaType<EventType, EventMetaType>) => {
				const nextEventsToProcess: TAutomataEventStack<EventType, EventMetaType> = [];

				// 1) Event -> Actions
				const actions = bridge.handleEvent({ event, meta });

				// 2) Actions -> FSM -> Transition -> Emitted Events
				for (const a of actions) {
					machine.dispatch(a);
					const emitted = bridge.handleTransition(machine.getContext()) ?? [];
					if (emitted?.length) {
						for (const event of emitted) this.enqueueEffectEvent(event);
						nextEventsToProcess.push(...emitted);
					}
				}

				return {
					event,
					meta,
					task_id: `event_${String(event)}`,
					result: Promise.resolve(nextEventsToProcess),
				};
			};

			this.bus.subscribe(evt, handler);
			unsubs.push(() => this.bus.unsubscribe(evt, handler));
		}

		this.automata.set(id, { id, unsubs });
		return this;
	}

	/**
	 * Unregisters a previously registered automata.
	 *
	 * Behavior:
	 * - Safely unsubscribes all event bus subscriptions created during registration.
	 * - Removes automata entry from the registry. No-op if not found.
	 *
	 * @param id Automata correlationId passed during registration.
	 * @returns This CoreLoop instance for chaining.
	 */
	public unregisterAutomata(id: string): this {
		const reg = this.automata.get(id);
		if (reg) {
			reg.unsubs.forEach(u => u());
			this.automata.delete(id);
		}
		return this;
	}

	/**
	 * Registers a Source (`IDataSource`). The Source only enqueues packets; the loop pulls them on each
	 * tick (`tick()` -> `drainSource`). The Source is started immediately if the loop is already
	 * running; otherwise it is started by {@link CoreLoop.start}.
	 *
	 * @param src Data Source to register; must expose a non-empty string id.
	 * @throws Error if id is empty or already registered.
	 * @returns This CoreLoop instance for chaining.
	 */
	public registerSource<DataPacketType = unknown>(
		src: IDataSource<EventType, EventMetaType, DataPacketType>,
	): this {
		if (!src.id || src.id.length === 0) {
			throw new Error('Source must provide a non-empty string id');
		}
		const id = src.id;

		if (this.sources.has(id)) {
			throw new Error(`Source with id "${id}" already registered`);
		}

		this.sources.set(id, {
			id,
			src: src as IDataSource<EventType, EventMetaType, any>,
			start: () => src.start(),
			stop: () => src.stop(),
		});

		if (this.started) src.start();

		return this;
	}

	/**
	 * One pump cycle: drain every active Source's `eventEmitter()` into the bus. Public so the loop can
	 * be driven deterministically in tests (or manually) instead of by the clock.
	 */
	public tick(): void {
		this.sources.forEach(s => this.drainSource(s.src));
	}

	/**
	 * Pull every queued event-stack from the source's `eventEmitter()` and publish each event to the
	 * bus. The generator yields `[]` once the queue is empty, which terminates the loop.
	 */
	private drainSource(src: IDataSource<EventType, EventMetaType, any>): void {
		if (!src.isActive()) return;
		const events = src.eventEmitter();
		for (let i = 0; i < CoreLoop.DRAIN_GUARD; i++) {
			const { value } = events.next();
			if (!value || value.length === 0) break;
			for (const event of value) this.publishToBus(event);
		}
	}

	/**
	 * Unregisters a previously registered Source by id.
	 *
	 * Behavior:
	 * - Calls Source.stop() if present.
	 * - Removes the source from the registry. No-op if not found.
	 *
	 * @param id Source identifier assigned on registration.
	 * @returns This CoreLoop instance for chaining.
	 */
	public unregisterSource(id: string): this {
		const reg = this.sources.get(id);
		if (reg) {
			reg.stop();
			this.sources.delete(id);
		}
		return this;
	}

	/**
	 * Registers a Destination (`IDataDestination`). The loop subscribes each of the Destination's
	 * bound events (`getBoundEvents()`) to the bus and forwards matching events through
	 * `update(event)`, where the Destination's selector + resolver pipeline takes over.
	 *
	 * Follow-up events (if any) are emitted by a paired Data Source (see `createPromiseDataAdapter`),
	 * which the loop pumps on its tick — not via the bus handler's `result`.
	 *
	 * @param dst Destination to register; must expose a non-empty string id.
	 * @throws Error if id is empty or already registered.
	 * @returns This CoreLoop instance for chaining.
	 */
	public registerDestination<
		DataModel extends object | null = object | null,
		DataPacketType extends object = object,
		ResolveResultType = any,
		ErrorType = Error,
	>(
		dst: IDataDestination<EventType, EventMetaType, DataModel, DataPacketType, ResolveResultType, ErrorType>,
	): this {
		if (!dst.id || dst.id.length === 0) {
			throw new Error('Destination must provide a non-empty string id');
		}
		const id = dst.id;

		if (this.destinations.has(id)) throw new Error(`Destination with id "${id}" already registered`);

		const destinationEvents = dst.getBoundEvents();
		// Legacy event-only Destinations subscribe to explicit Events. With a Data
		// Model, CoreLoop invokes both explicit and wildcard triggers after commit.
		const boundEvents = destinationEvents
			.filter((event): event is EventType => event !== null);

		const handler = (raw: TAutomataEventMetaType<EventType, EventMetaType>) => {
			dst.update(raw);
			return {
				event: raw.event,
				meta: raw.meta ?? null,
				task_id: `dst_${id}_${String(raw.event)}`,
				// Synchronous handler: no in-band follow-up. Any response event is emitted later
				// by the destination's paired Data Source, drained by the loop on its tick.
				result: null,
			};
		};

		let subscribed = false;
		const subscribe = () => {
			if (subscribed || this.effectScheduler) return;
			for (const event of boundEvents) this.bus.subscribe(event, handler);
			subscribed = true;
		};
		const unsubscribe = () => {
			if (!subscribed) return;
			for (const event of boundEvents) this.bus.unsubscribe(event, handler);
			subscribed = false;
		};

		subscribe();
		dst.start();

		this.destinations.set(id, {
			id,
			boundEvents: destinationEvents,
			update: (event, model) => dst.update(
				event as TAutomataEventMetaType<EventType, EventMetaType>,
				model as DataModel,
			),
			subscribe,
			unsubscribe,
			start: () => dst.start(),
			stop: () => dst.stop(),
		});
		return this;
	}

	/**
	 * Unregisters a previously registered Destination by id.
	 *
	 * Behavior:
	 * - Unsubscribes the destination's bus handlers and stops it.
	 * - Removes the destination from the registry. No-op if not found.
	 *
	 * @param id Destination identifier assigned on registration.
	 * @returns This CoreLoop instance for chaining.
	 */
	public unregisterDestination(id: string): this {
		const reg = this.destinations.get(id);
		if (reg) {
			reg.unsubscribe();
			reg.stop();
			this.destinations.delete(id);
		}
		return this;
	}

	public start(): this {
		if (this.started) return this;
		this.started = true;
		this.destinations.forEach((destination) => {
			destination.subscribe();
			destination.start();
		});
		this.slices.forEach(registered => registered.slice.start());
		this.bus.resume();
		this.sources.forEach(s => s.start());
		return this;
	}

	public stop(): this {
		if (!this.started) return this;
		this.started = false;
		this.bus.pause();
		this.sources.forEach(s => s.stop());
		this.destinations.forEach((destination) => {
			destination.unsubscribe();
			destination.stop();
		});
		this.slices.forEach(registered => registered.slice.stop(false));
		return this;
	}
}
