import { AbstractBaseClass } from './mixins/BaseClass';
import ExtendedEventContainer from './mixins/ExtendedEventContainer';
import { TAbstractConstructor, TAutomataBaseEventType, TAutomataEventStack, TCycleIteratorInfo, TDataSourceConstructorOpts } from './types';
import { IAgnosticDataSource, IDataSource } from './types/interfaces';

export abstract class AbstractAgnosticDataSource<T> extends AbstractBaseClass implements IAgnosticDataSource<T> {
	#_dataPacketQueue: T[] = [];
	#active = false;
	#currentCycle = 0;
	#totalCycles = 0;
	#epoch = 1;
	#id: string;

	public get currentCycle(): number {
		return this.#currentCycle;
	}

	public get totalCycles(): number {
		return this.#totalCycles;
	}

	public get currentEpoch(): number {
		return this.#epoch;
	}

	public get id(): string {
		return this.#id;
	}

	protected _getCycleIteratorInfo(): TCycleIteratorInfo {
		return {
			currentCycle: this.currentCycle,
			totalCycles: this.totalCycles,
			currentEpoch: this.currentEpoch,
		};
	}

	protected _isValidId(id: any): id is string {
		return id === undefined || id === null || (typeof id === 'string' && id?.length > 0);
	}

	protected clearQueue() {
		const d = this.#_dataPacketQueue.slice();
		this.#_dataPacketQueue = [];
		this.#currentCycle = 0;
		this.#epoch++;
		return d;
	}

	public constructor(opts: TDataSourceConstructorOpts<T>) {
		super();
		if (!this._isValidId(opts?.id))
			throw new TypeError('Invalid ID');
		this.#id = opts.id || this.correlationId;
		if (typeof opts?.afterInit === 'function') {
			opts.afterInit(
				this.id,
				(data: T) => this._addDataPacket(data),
				this.clearQueue.bind(this),
			);
		} else if (opts?.afterInit) {
			throw new TypeError(`Invalid afterInit function for Data Source #${this.id}`);
		}
	}

	public start(): this {
		this.#currentCycle = 0;
		this.#epoch++;
		this.#active = true;
		return this;
	}

	public stop(): this {
		this.#active = false;
		return this;
	}

	public isActive(): boolean {
		return this.#active;
	}

	protected _addDataPacket(dataPacket: T): void {
		this.#currentCycle++;
		this.#totalCycles++;
		this.#_dataPacketQueue.push(dataPacket);
	}

	protected _getDataPacket(): T | null {
		const t = this.#_dataPacketQueue.shift();
		if (t === undefined) return null;
		return t;
	}

	public *dataEmitter() {
		while (true) {
			if (this.isActive() && this.#_dataPacketQueue.length) {
				yield this._getDataPacket();
			} else {
				yield null;
			}
		}
	}
}

type TIntervalTimerDataSourceDataPacket = {
	id: string;
	timestamp: number;
	startTimestamp: number;
} & TCycleIteratorInfo;
export class IntervalTimerDataSource extends AbstractAgnosticDataSource<TIntervalTimerDataSourceDataPacket> {
	#intervalLink: any = null;
	#interval: number = 0;
	#startTimestamp = 0;

	protected _isValidInterval(interval: any): interval is number {
		return Number.isFinite(interval) && Number.isInteger(interval) && interval > 0;
	}

	public constructor(opts: TDataSourceConstructorOpts<TIntervalTimerDataSourceDataPacket> & { interval: number }) {
		super(opts);
		if (!this._isValidInterval(opts.interval))
			throw new RangeError(`Invalid timer interval for Data Source #${this.id}`);
		this.#interval = opts.interval;
	}

	override start(): this {
		super.start();
		this.#startTimestamp = Date.now();
		if (this.#intervalLink != null)
			clearInterval(this.#intervalLink);
		this.#intervalLink = setInterval(() => this._addDataPacket({
			id: this.id,
			startTimestamp: this.#startTimestamp,
			timestamp: Date.now(),
			...this._getCycleIteratorInfo(),
		}), this.#interval);
		return this;
	}

	override stop(): this {
		super.stop();
		if (this.#intervalLink != null) {
			clearInterval(this.#intervalLink);
			this.#intervalLink = null;
		}
		return this;
	}
}

export class NamedDataSource<T> extends AbstractAgnosticDataSource<T> {
	protected override _addDataPacket(dataPacket: T): void {
		super._addDataPacket(Object.assign({}, dataPacket, { id: this.id }));
	}
}

export function createDataSourceAdapter<
	EventType extends TAutomataBaseEventType = TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
	DataPacketType = any,
>() {
	return <BaseType extends TAbstractConstructor<
		AbstractAgnosticDataSource<DataPacketType>
	> = TAbstractConstructor<
		AbstractAgnosticDataSource<DataPacketType>
	>>(Base: BaseType) =>
		class AbstractAutomataDataSource extends ExtendedEventContainer<
			EventType,
			EventMetaType
		>()(Base) implements IDataSource<EventType, EventMetaType, DataPacketType> {
			#eventListeners: Partial<{
				[id: string]: [
					(data: DataPacketType) => TAutomataEventStack<EventType, EventMetaType>,
                    null | ((...events: TAutomataEventStack<EventType, EventMetaType>) => any),
				];
			}> = {};

			addListener(
				id: string,
				transform: (data: DataPacketType) => TAutomataEventStack<EventType, EventMetaType>,
				dispatch?: (...events: TAutomataEventStack<EventType, EventMetaType>) => any,
			): this {
				if (typeof transform !== 'function')
					throw new TypeError(`Invalid transformer provided in event listener for Data Source #${this.id}`);
				if (dispatch && typeof dispatch !== 'function')
					throw new TypeError(`Invalid dispatcher provided in event listener for Data Source #${this.id}`);
				this.#eventListeners[id] = [transform, dispatch || null];
				return this;
			}

			removeListener(id: string): this {
				if (!this.#eventListeners[id])
					throw new TypeError(`Invalid event listener id for Data Source #${this.id}`);
				delete this.#eventListeners[id];
				return this;
			}

			getEventListeners() {
				return this.#eventListeners;
			}

			protected getListenerKeys() {
				return Object.keys(this.#eventListeners);
			}

			override *dataEmitter() {
				const dataEmitter = super.dataEmitter();
				while (true) {
					const dataPacket = dataEmitter.next();
					if (dataPacket.value) {
						for (const id of this.getListenerKeys()) {
							const [transform, dispatch] = this.#eventListeners[id]!;
							const events = transform(dataPacket.value) || [];
							if (!events.length)
								continue;
							if (!events.some(this.validateEventMeta))
								throw new Error(`Got invalid event stack from transformer: ${JSON.stringify(events)}`);
							if (dispatch) {
								dispatch(...events);
							}
						}
						yield dataPacket.value;
					} else {
						yield null;
					}
				}
			}

			*eventEmitter(): IterableIterator<TAutomataEventStack<EventType, EventMetaType>> {
				const dataEmitter = super.dataEmitter();
				let allEvents: TAutomataEventStack<EventType, EventMetaType> = [];
				while (true) {
					const dataPacket = dataEmitter.next();
					allEvents = [];
					if (dataPacket.value) {
						for (const id of this.getListenerKeys()) {
							const [transform, dispatch] = this.#eventListeners[id]!;
							const events = transform(dataPacket.value) || [];
							if (!events.length)
								continue;
							if (!events.some(this.validateEventMeta))
								throw new Error(`Got invalid event stack from transformer: ${events}`);
							allEvents = allEvents.concat(events);
							if (dispatch) {
								dispatch(...events);
							}
						}
					}
					yield allEvents;
				}
			}
		};
}

export class BasicDataSource extends createDataSourceAdapter<
	TAutomataBaseEventType,
	Record<TAutomataBaseEventType, any>,
object
>()(NamedDataSource<object>) { }
export default BasicDataSource;
