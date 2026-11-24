import { AbstractBaseClass } from './mixins/BaseClass.js';
import ExtendedEventContainer from './mixins/ExtendedEventContainer.js';
import { TAutomataBaseEventType, TAutomataEventStack, TBaseClassConstructor, TEventBusHandler } from './types/index.js';
import { IAutomataEventBus } from './types/interfaces.js';

export const STACK_RECURSION_LIMIT_RATIO = 2;
export const STACK_PROCESSING_BATCH_SIZE = 32;
export function createEventBus<
	EventType extends TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
>() {
	return <TBase extends TBaseClassConstructor>(Proto: TBase) =>
		class AbstractAutomataEventBus
			extends ExtendedEventContainer<EventType, EventMetaType>()(Proto)
			implements IAutomataEventBus<EventType, EventMetaType> {
			#isProcessing: boolean;
			#isPaused: boolean;
			#eventStack: TAutomataEventStack<EventType, EventMetaType>;
			#eventSubscriptions: Map<EventType, Set<TEventBusHandler<EventType, EventMetaType>>>;
			#idleWaiters: Set<{ resolve: () => void; reject: (reason: unknown) => void }>;
			#failure?: { reason: unknown };

			constructor() {
				super();
				this.#eventStack = [];
				this.#eventSubscriptions = new Map();
				this.#idleWaiters = new Set();
				this.#isProcessing = false;
				this.#isPaused = false;
			}

			/**
			 * Subscribes to the given event. When the event is received, the callback will be called with the event as an argument.
			 * The callback should return a task with incoming event, task ID and a result, which is
			 * - either null (if the event was processed synchronously)
			 * - or a promise that resolves with an array of new events to be dispatched to the bus.
			 * @param event - The event to subscribe to
			 * @param callback - The callback to call when the event is received
			 * @returns This event bus instance
			 */
			public subscribe(event: EventType, callback: TEventBusHandler<EventType, EventMetaType>): this {
				if (!this.validateEvent(event))
					throw new TypeError(`Invalid event passed for subscription}`);

				if (typeof (callback) !== 'function')
					throw new TypeError('Invalid callback passed for subscription');

				let eventCallbacks = this.#eventSubscriptions.get(event);

				if (!eventCallbacks) {
					eventCallbacks = new Set();
					this.#eventSubscriptions.set(event, eventCallbacks);
				}

				eventCallbacks.add(callback);

				return this;
			}

			public unsubscribe(event: EventType, callback: null | TEventBusHandler<EventType, EventMetaType>): this {
				if (!this.validateEvent(event))
					throw new TypeError(`Invalid event passed for subscription}`);

				const eventCallbacks = this.#eventSubscriptions.get(event);
				if (eventCallbacks && callback) {
					eventCallbacks.delete(callback);
				} else if (!callback) {
					this.#eventSubscriptions.delete(event);
				}

				return this;
			}

			/**
			 * Dispatches events to the event bus. If the event bus is not paused, the events will be immediately processed.
			 * If the event bus is paused, the events will be buffered and processed when the event bus is resumed.
			 * @param events - The events to dispatch
			 * @returns This event bus instance
			 */
			public dispatch(...events: TAutomataEventStack<EventType, EventMetaType>): this {
				if (events.length && !this.#isProcessing && !this.#eventStack.length) this.#failure = undefined;
				this.#eventStack.push(...events);
				this._processEvents();
				return this;
			}

			public getEventStack(): TAutomataEventStack<EventType, EventMetaType> {
				return this.#eventStack.slice();
			}

			/** ***********  ✨ Windsurf Command ⭐  */
			/**
			 * Clears the event stack of all events. This method does not prevent new events from being dispatched.
			 * @returns This event bus instance
			 */
			/** *****  12c97ac8-1158-4225-8ad9-1724f95adea2  */
			public clearEventStack(): this {
				this.#eventStack = [];
				this.#settleIdleWaiters();
				return this;
			}

			public pause(): this {
				this.#isPaused = true;
				return this;
			}

			public resume(): this {
				this.#isPaused = false;
				this._processEvents();
				return this;
			}

			public isRunning(): boolean {
				return !this.#isPaused;
			}

			/** Reports the first failure in the current drain, including to observers arriving after it ended. */
			public whenIdle(): Promise<void> {
				if (!this.#isProcessing && this.#eventStack.length === 0) {
					return this.#failure ? Promise.reject(this.#failure.reason) : Promise.resolve();
				}

				return new Promise((resolve, reject) => {
					this.#idleWaiters.add({ resolve, reject });
				});
			}

			#settleIdleWaiters(): void {
				if (this.#isProcessing || this.#eventStack.length > 0) return;
				const waiters = [...this.#idleWaiters];
				this.#idleWaiters.clear();
				for (const waiter of waiters) {
					if (this.#failure) waiter.reject(this.#failure.reason);
					else waiter.resolve();
				}
			}

			#finishBatch(failure?: { reason: unknown }): void {
				this.#failure ??= failure;
				this.#isProcessing = false;
				if (!this.#eventStack.length) {
					this.#settleIdleWaiters();
				} else if (!this.#isPaused) {
					queueMicrotask(() => {
						try {
							this._processEvents();
						} catch {
							// Scheduled batches have no synchronous caller. whenIdle reports the failure.
						}
					});
				}
			}

			public [Symbol.dispose](): void {
				this.pause();
				this.clearEventStack();
				this.#eventSubscriptions.clear();
			}

			/**
			 * Processes events in the event stack and handles them using subscribed callbacks.
			 *
			 * This method iterates over the event stack, invoking the corresponding callbacks for each valid event,
			 * and processes a batch of events limited by `STACK_PROCESSING_BATCH_SIZE`. It checks for recursive event
			 * emissions and ensures that the recursion limit does not exceed the defined
			 * `STACK_RECURSION_LIMIT_RATIO` relative to the current stack length.
			 *
			 * @returns {TAutomataEventStack<EventType, EventMetaType>} new events acquired from processing the queue.
			 *
			 * @throws {Error} If the recursion limit, calculated as a ratio of the stack length, is exceeded for any event.
			 *
			 */
			_processEvents(): Promise<TAutomataEventStack<EventType, EventMetaType>> {
				if (this.#isProcessing || this.#isPaused) {
					return Promise.resolve([]);
				}
				const promiseStack: Array<Promise<TAutomataEventStack<EventType, EventMetaType>>> = [];
				let counter = 0;
				this.#isProcessing = true;
				try {
					while (
						this.#eventStack.length > 0
						&& counter++ < STACK_PROCESSING_BATCH_SIZE
					) {
						const eventObject = this.#eventStack.shift();
						if (!eventObject)
							continue;

						if (!this.validateEventMeta(eventObject)) throw new TypeError('Invalid Event in the queue');

						const eventCallbacks = this.#eventSubscriptions.get(eventObject.event);

						if (!eventCallbacks?.size) continue;

						eventCallbacks.forEach((callback) => {
							const eventResult = callback(eventObject);

							if (!eventResult?.result) return;

							promiseStack.push(eventResult.result);
						});
						if (
							promiseStack.length > STACK_RECURSION_LIMIT_RATIO * this.#eventStack.length
							&& (this.#eventStack.length > 1)
						) {
							throw new Error(
								`Stack is growing too fast: ${eventObject}`,
							);
						}
					}
				} catch (reason) {
					if (promiseStack.length) {
						// Tasks started before the throw still belong to this batch.
						void Promise.allSettled(promiseStack).then(() => this.#finishBatch({ reason }));
					} else {
						this.#finishBatch({ reason });
					}
					throw reason;
				}

				if (!promiseStack.length) {
					this.#finishBatch();
					return Promise.resolve([]);
				}

				const returnValue = Promise.allSettled(promiseStack).then((results) => {
					const events = results.flatMap((result) => {
						if (result.status === 'rejected') throw result.reason;
						return result.value;
					});
					if (events.some(event => !this.validateEventMeta(event)))
						throw new TypeError('Invalid event received from promise');
					this.#eventStack.push(...events);
					return events;
				});
				void returnValue.then(
					() => this.#finishBatch(),
					reason => this.#finishBatch({ reason }),
				);

				return returnValue;
			}
		};
}

/**
 * Basic event bus class that is used in Yantrix automatas.
 */
export class BasicEventBus
	extends createEventBus<TAutomataBaseEventType, Record<TAutomataBaseEventType, any>>()(AbstractBaseClass)
	implements IAutomataEventBus<TAutomataBaseEventType, Record<TAutomataBaseEventType, any>> {
	constructor() {
		super();
	}
}

export default BasicEventBus;
