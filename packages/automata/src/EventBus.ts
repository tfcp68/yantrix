/*
import {
	TAutomataBaseEventType,
	TAutomataEventStack,
	TEventBusHandler,
} from './types/index.js';
import { IAutomataEventBus } from './types/interfaces.js';

class AutomataEventBus<
	EventType extends TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>
> implements IAutomataEventBus<EventType, EventMetaType>
{
	protected isProcessing: boolean;
	protected isPaused: boolean;
	protected eventStack: TAutomataEventStack<EventType, EventMetaType>;
	protected eventSubscriptions: Map<
		EventType,
		Set<TEventBusHandler<EventType, EventMetaType>>
	>;

	constructor() {
		this.eventStack = [];
		this.eventSubscriptions = new Map();
		this.isProcessing = false;
		this.isPaused = false;
	}

	public subscribe(
		event: EventType,
		callback: TEventBusHandler<EventType, EventMetaType>
	): this {
		let eventCallbacks = this.eventSubscriptions.get(event);
		if (!eventCallbacks) {
			eventCallbacks = new Set();
			this.eventSubscriptions.set(event, eventCallbacks);
		}
		eventCallbacks.add(callback);
		return this;
	}

	public unsubscribe(
		event: EventType,
		callback: null | TEventBusHandler<EventType, EventMetaType>
	): this {
		const eventCallbacks = this.eventSubscriptions.get(event);
		if (eventCallbacks && callback) {
			eventCallbacks.delete(callback);
		}
		return this;
	}

	public dispatch(
		...events: TAutomataEventStack<EventType, EventMetaType>
	): this {
		this.eventStack.push(...events);
		this.processEvents();
		return this;
	}

	public getEventStack(): TAutomataEventStack<EventType, EventMetaType> {
		return this.eventStack.slice();
	}

	public clearEventStack(): this {
		this.eventStack = [];
		return this;
	}

	public pause(): this {
		this.isPaused = true;
		return this;
	}

	public resume(): this {
		this.isPaused = false;
		this.processEvents();
		return this;
	}

	public isRunning(): boolean {
		return !this.isPaused;
	}

	public processEvents(): TAutomataEventStack<EventType, EventMetaType> {
		if (this.isProcessing || this.isPaused) {
			return [];
		}

		this.isProcessing = true;
		while (this.eventStack.length > 0) {
			const eventObject = this.eventStack.shift();
			const { event, meta } = eventObject;
			if (!this.validateEvent(event))
				const eventCallbacks = this.eventSubscriptions.get(event);
			if (eventCallbacks) {
				eventCallbacks.forEach((callback) => {
					callback(meta);
				});
			}
		}
		this.isProcessing = false;

		return this.eventStack.slice();
	}
}
*/
