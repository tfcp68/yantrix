import AutomataEventAdapter from './EventAdapter';
import BasicEventBus from './EventBus';
import {
	IEventDestination,
	IEventSource,
	TAutomataBaseActionType,
	TAutomataBaseEventType,
	TAutomataBaseStateType,
	TAutomataEventMetaType,
	TAutomataEventStack,
} from './types';
import { IAutomata, IAutomataEventAdapter, IAutomataEventBus } from './types/interfaces';

type TUnsub = () => void;

type TRegisteredAutomata = {
	id: string;
	unsubs: TUnsub[];
};

type TRegisteredDestination = {
	id: string;
	unsub: TUnsub;
};

type TRegisteredSource = {
	id: string;
	stop: () => void;
};
/**
 * CoreLoop is a minimal main-loop that connects:
 * - an Event Bus (pub/sub for Events),
 * - one or more FSMs (IAutomata) through an Event Adapter,
 * - Sources (producers of Events),
 * - Destinations (consumers of Events).
 *
 * Responsibilities:
 * - Subscribe the adapter to observed Events and dispatch mapped Actions to the FSM.
 * - After each FSM transition, translate emitted Events via the adapter and re-dispatch them to the Event Bus.
 * - Manage lifecycle (start/stop) of Sources and Destinations.
 *
 * Generics:
 * - EventType: enum/number of Events
 * - EventMetaType: a map EventType -> meta payload shape
 */
export class CoreLoop<
	EventType extends TAutomataBaseEventType = TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
> {
	private readonly bus: IAutomataEventBus<EventType, EventMetaType>;
	private readonly automata: Map<string, TRegisteredAutomata> = new Map();
	private readonly destinations: Map<string, TRegisteredDestination> = new Map();
	private readonly sources: Map<string, TRegisteredSource> = new Map();
	private started = false;

	protected readonly publishToBus = (
		event: TAutomataEventMetaType<EventType, EventMetaType>,
	): void => {
		this.bus.dispatch(event);
	};

	constructor(bus?: IAutomataEventBus<EventType, EventMetaType>) {
		this.bus = (bus ?? (new BasicEventBus() as unknown as IAutomataEventBus<EventType, EventMetaType>));
	}

	public getBus(): IAutomataEventBus<EventType, EventMetaType> {
		return this.bus;
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
	 * @param id Unique identifier for the automata within this CoreLoop
	 * @param machine Automata instance to register
	 * @param adapter Optional AutomataEventAdapter; created if not provided
	 * @throws Error when an automata with the same id is already registered
	 * @returns This CoreLoop instance (for chaining)
	 */
	public registerAutomata<
		StateType extends TAutomataBaseStateType,
		ActionType extends TAutomataBaseActionType,
		ContextType extends { [K in StateType]: any } = Record<StateType, any>,
		PayloadType extends { [K in ActionType]: any } = Record<ActionType, any>,
	>(
		id: string,
		machine: IAutomata<StateType, ActionType, EventType, ContextType, PayloadType, EventMetaType>,
		adapter?: AutomataEventAdapter,
	): this {
		if (this.automata.has(id)) throw new Error(`Automata with id "${id}" already registered`);

		const bridge
			= adapter
			?? new AutomataEventAdapter();

		// Attach adapter to the automata:
		machine.eventAdapter = bridge as unknown as IAutomataEventAdapter<
			StateType,
			ActionType,
			EventType,
			ContextType,
			PayloadType,
			EventMetaType
		>;

		// Subscribe to the Event Bus for events observed by the adapter
		const observed = bridge.getObservedEvents();
		const unsubs: TUnsub[] = [];

		for (const evt of observed) {
			const handler = ({ event, meta }: TAutomataEventMetaType<EventType, EventMetaType>) => {
				const nextEventsToProcess: TAutomataEventStack<EventType, EventMetaType> = [];

				// 1) Event -> Actions
				const actions = bridge.handleEvent({ event, meta } as any);

				// 2) Actions -> FSM -> Transition -> Emitted Events
				for (const a of actions) {
					machine.dispatch(a as any);
					const emitted = bridge.handleTransition(machine.getContext()) ?? [];
					if (emitted?.length) {
						nextEventsToProcess.push(...(emitted as TAutomataEventStack<EventType, EventMetaType>));
					}
				}

				return {
					event,
					meta,
					task_id: `event_${String(event)}`,
					result: Promise.resolve(nextEventsToProcess),
				};
			};

			this.bus.subscribe(evt as EventType, handler as any);
			unsubs.push(() => this.bus.unsubscribe(evt as EventType, handler as any));
		}

		this.automata.set(id, { id, unsubs });
		return this;
	}

	/**
	 * Unregisters a previously registered automata by id.
	 *
	 * Behavior:
	 * - Safely unsubscribes all event bus subscriptions created during registration.
	 * - Removes automata entry from the registry. No-op if not found.
	 *
	 * @param id Automata identifier passed during registration.
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
	 * Registers a Source. The Source is started immediately if the loop is already running.
	 * Note: This method treats the passed-in object as immutable and does NOT mutate src.id.
	 * Non-empty src. Id is required.
	 */
	public registerSource(src: IEventSource<EventType, EventMetaType>): this {
		if (!src.id || src.id.length === 0) {
			throw new Error('Source must provide a non-empty string id');
		}
		const id = src.id;

		if (this.sources.has(id)) {
			throw new Error(`Source with id "${id}" already registered`);
		}

		if (this.started) {
			src.start(this.publishToBus);
		}

		this.sources.set(id, {
			id,
			stop: () => src.stop(),
		});

		return this;
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
	 * Registers a Destination. Destination is responsible for its own subscriptions via bind().
	 *
	 * @param dst Destination to register
	 * @throws Error if a Destination with the same id is already registered
	 * @returns This CoreLoop instance for chaining.
	 */
	public registerDestination(dst: IEventDestination<EventType, EventMetaType>): this {
		if (!dst.id || dst.id.length === 0) {
			throw new Error('Destination must provide a non-empty string id');
		}
		const id = dst.id;

		if (this.destinations.has(id)) throw new Error(`Destination with id "${id}" already registered`);

		const unsub = dst.bind(this.bus);
		this.destinations.set(id, { id, unsub });
		return this;
	}

	/**
	 * Unregisters a previously registered Destination by id.
	 *
	 * Behavior:
	 * - Invokes the unsubscription function returned by Destination.bind().
	 * - Removes the destination from the registry. No-op if not found.
	 *
	 * @param id Destination identifier assigned on registration.
	 * @returns This CoreLoop instance for chaining.
	 */
	public unregisterDestination(id: string): this {
		const reg = this.destinations.get(id);
		if (reg) {
			reg.unsub();
			this.destinations.delete(id);
		}
		return this;
	}

	public start(): this {
		if (this.started) return this;
		this.started = true;
		this.bus.resume();

		return this;
	}

	public stop(): this {
		if (!this.started) return this;
		this.started = false;
		this.bus.pause();

		// Stop all sources
		this.sources.forEach(s => s.stop());

		// Unsubscribe all destinations
		this.destinations.forEach(d => d.unsub());

		return this;
	}
}
