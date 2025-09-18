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

	constructor(bus?: IAutomataEventBus<EventType, EventMetaType>) {
		this.bus = (bus ?? (new BasicEventBus() as unknown as IAutomataEventBus<EventType, EventMetaType>));
	}

	public getBus(): IAutomataEventBus<EventType, EventMetaType> {
		return this.bus;
	}

	/**
	 * Регистрирует автомат и прокладывает маршруты:
	 * - события из шины -> адаптер автомата -> Actions -> dispatch в автомат
	 * - переходы автомата -> адаптер -> события -> шина (через EventBusAwareEventAdapter)
	 *
	 * Ожидается, что у адаптера уже настроены маппинги addEventListener(...) и addEventEmitter(...).
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

		// Подключаем адаптер к автомату:
		machine.eventAdapter = bridge as unknown as IAutomataEventAdapter<
			StateType,
			ActionType,
			EventType,
			ContextType,
			PayloadType,
			EventMetaType
		>;

		// Подписываемся на события шины, которые интересуют адаптер
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
						nextEventsToProcess.push(...emitted as TAutomataEventStack<EventType, EventMetaType>);
					}
				}

				// 3) Re-dispatch emitted events back to the Bus
				if (nextEventsToProcess.length) {
					for (const e of nextEventsToProcess) {
						this.bus.dispatch(e);
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

	public unregisterAutomata(id: string): this {
		const reg = this.automata.get(id);
		if (reg) {
			reg.unsubs.forEach(u => u());
			this.automata.delete(id);
		}
		return this;
	}

	/**
	 * Регистрирует источник: он стартует с publish, который диспатчит события в шину
	 */
	public registerSource(src: IEventSource<EventType, EventMetaType>): this {
		if (!src.id) {
			src.id = crypto?.randomUUID?.() ?? `src_${Math.random().toString(36).slice(2)}`;
		}
		if (this.sources.has(src.id)) throw new Error(`Source with id "${src.id}" already registered`);

		const publish = (event: TAutomataEventMetaType<EventType, EventMetaType>) => {
			this.bus.dispatch(event);
		};

		if (this.started) {
			src.start(publish);
		}

		this.sources.set(src.id, {
			id: src.id,
			stop: () => src.stop(),
		});
		return this;
	}

	public unregisterSource(id: string): this {
		const reg = this.sources.get(id);
		if (reg) {
			reg.stop();
			this.sources.delete(id);
		}
		return this;
	}

	/**
	 * Регистрирует приемник: он сам подписывается на нужные события в bind()
	 */
	public registerDestination(dst: IEventDestination<EventType, EventMetaType>): this {
		if (!dst.id) {
			dst.id = crypto?.randomUUID?.() ?? `dst_${Math.random().toString(36).slice(2)}`;
		}
		if (this.destinations.has(dst.id)) throw new Error(`Destination with id "${dst.id}" already registered`);

		const unsub = dst.bind(this.bus);
		this.destinations.set(dst.id, { id: dst.id, unsub });
		return this;
	}

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

		// Останавливаем источники
		this.sources.forEach(s => s.stop());

		// Отписываем приемники
		this.destinations.forEach(d => d.unsub());

		return this;
	}
}
