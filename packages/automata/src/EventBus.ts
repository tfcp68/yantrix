import { AbstractBaseClass } from './mixins/BaseClass.js';
import ExtendedEventContainer from './mixins/ExtendedEventContainer.js';
import { TAutomataBaseEventType, TAutomataEventStack, TBaseClassConstructor, TEventBusHandler } from './types/index.js';
import { IAutomataEventBus } from './types/interfaces.js';

export const STACK_RECURSION_LIMIT_RATIO = 2;
export const STACK_PROCESSING_BATCH_SIZE = 32;

/** Order in which the `Event Bus` takes its next `Event` from the pending queue. */
export type TEventBusOrder = 'fifo' | 'lifo';

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
			readonly #order: TEventBusOrder;
			#eventStack: TAutomataEventStack<EventType, EventMetaType>;
			#eventSubscriptions: Map<EventType, Set<TEventBusHandler<EventType, EventMetaType>>>;
			#idleWaiters: Set<{ resolve: () => void; reject: (reason: unknown) => void }>;
			#failure?: { reason: unknown };
			readonly #recursiveGrowthBudget = new Map<EventType, number>();

			constructor(order: TEventBusOrder = 'fifo') {
				super();
				if (order !== 'fifo' && order !== 'lifo') throw new TypeError('Event bus order must be fifo or lifo');
				this.#order = order;
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
					this.#recursiveGrowthBudget.clear();
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

			#checkRecursiveGrowth(selfGrowth: Map<EventType, number>, pending: number): void {
				for (const [source, growth] of selfGrowth) {
					const budget = this.#recursiveGrowthBudget.get(source);
					if (growth <= 0) {
						this.#recursiveGrowthBudget.delete(source);
					} else if (budget === undefined) {
						const baseline = Math.max(STACK_PROCESSING_BATCH_SIZE, pending);
						this.#recursiveGrowthBudget.set(source, baseline * STACK_RECURSION_LIMIT_RATIO);
					} else if (growth > budget) {
						throw new Error(`Stack is growing too fast: event ${source} repeatedly emits itself`);
					} else {
						this.#recursiveGrowthBudget.set(source, budget - growth);
					}
				}
			}

			public [Symbol.dispose](): void {
				this.pause();
				this.clearEventStack();
				this.#eventSubscriptions.clear();
			}

			/**
			 * Processes `Events` in the `Event Stack` and handles them using subscribed callbacks.
			 *
			 * This method iterates over the `Event Stack`, invoking the corresponding callbacks for each valid `Event`,
			 * and processes a batch of `Events` limited by `STACK_PROCESSING_BATCH_SIZE`. When tasks repeatedly
			 * return more copies of their own `Event` ID than the batch consumed, limit their cumulative growth
			 * relative to the queue size after the first expanding batch. An isolated fan-out is allowed.
			 *
			 * @returns {TAutomataEventStack<EventType, EventMetaType>} new `Events` acquired from processing the queue.
			 *
			 * @throws {Error} If the recursion limit, calculated as a ratio of the stack length, is exceeded for any `Event`.
			 *
			 */
			_processEvents(): Promise<TAutomataEventStack<EventType, EventMetaType>> {
				if (this.#isProcessing || this.#isPaused) {
					return Promise.resolve([]);
				}
				const tasks: Array<{
					source: EventType;
					result: Promise<TAutomataEventStack<EventType, EventMetaType>>;
				}> = [];
				const selfGrowth = new Map<EventType, number>();
				let counter = 0;
				this.#isProcessing = true;
				try {
					while (
						this.#eventStack.length > 0
						&& counter++ < STACK_PROCESSING_BATCH_SIZE
					) {
						const eventObject = this.#order === 'fifo' ? this.#eventStack.shift() : this.#eventStack.pop();
						if (!eventObject)
							continue;

						if (!this.validateEventMeta(eventObject)) throw new TypeError('Invalid Event in the queue');

						const eventCallbacks = this.#eventSubscriptions.get(eventObject.event);

						if (!eventCallbacks?.size) continue;

						selfGrowth.set(eventObject.event, (selfGrowth.get(eventObject.event) ?? 0) - 1);
						eventCallbacks.forEach((callback) => {
							const eventResult = callback(eventObject);

							if (!eventResult?.result) return;

							tasks.push({ source: eventObject.event, result: eventResult.result });
						});
					}
				} catch (reason) {
					if (tasks.length) {
						// Tasks started before the throw still belong to this batch.
						void Promise.allSettled(tasks.map(task => task.result))
							.then(() => this.#finishBatch({ reason }));
					} else {
						this.#finishBatch({ reason });
					}
					throw reason;
				}

				if (!tasks.length) {
					this.#finishBatch();
					return Promise.resolve([]);
				}

				const returnValue = Promise.allSettled(tasks.map(task => task.result)).then((results) => {
					const events = results.flatMap((result, index) => {
						if (result.status === 'rejected') throw result.reason;
						const source = tasks[index]!.source;
						for (const event of result.value) {
							if (!this.validateEventMeta(event)) throw new TypeError('Invalid event received from promise');
							if (event.event === source) selfGrowth.set(source, selfGrowth.get(source)! + 1);
						}
						return result.value;
					});
					this.#checkRecursiveGrowth(selfGrowth, this.#eventStack.length + events.length);
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
	constructor(order: TEventBusOrder = 'fifo') {
		super(order);
	}
}

export default BasicEventBus;
