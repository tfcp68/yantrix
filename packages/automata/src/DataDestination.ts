import { AbstractBaseClass } from './mixins/BaseClass';
import ExtendedEventContainer from './mixins/ExtendedEventContainer';
import { TAbstractConstructor, TAutomataBaseEventType, TAutomataEventMetaType, TDataBoundEventDictionary, TDataBoundSelector, TDataDestinationConstructorOpts, TDataDestinationOutput, TDataDestinationResolver, WILDCARD_EVENT } from './types';
import { IAgnosticDataDestination, IDataDestination } from './types/interfaces';

export abstract class AbstractAgnosticDataDestination<
	DataPacketType,
	ResolveResultType,
	ErrorType = Error,
> extends AbstractBaseClass implements IAgnosticDataDestination<
	DataPacketType,
	ResolveResultType,
	ErrorType
> {
	#_dataPacketQueue: Array<TDataDestinationOutput<DataPacketType, ResolveResultType, ErrorType>> = [];
	#_requestQueue: Array<DataPacketType> = [];
	#active = false;
	#currentCycle = 0;
	#totalCycles = 0;
	#epoch = 0;
	#id: string;
	protected _resolver: null | TDataDestinationResolver<DataPacketType, ResolveResultType, IAgnosticDataDestination<
		DataPacketType,
		ResolveResultType,
		ErrorType
	>> = null;

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

	/**
	 * Constructs an instance of `AbstractAgnosticDataDestination`.
	 *
	 * @param opts - The options for the data destination.
	 * @param opts.id - A unique identifier for the data destination. Generated if not provided.
	 * @param opts.resolver - An optional function to resolve data packets.
	 * @param opts.afterInit - An optional callback invoked after initialization.
	 * @throws {TypeError} Throws if the ID is invalid.
	 * @throws {TypeError} Throws if the resolver is not a function.
	 */

	public constructor(opts: TDataDestinationConstructorOpts<
		DataPacketType,
		ResolveResultType,
		IAgnosticDataDestination<
			DataPacketType,
			ResolveResultType,
			ErrorType
		>
	>) {
		super();
		if (!this._isValidId(opts?.id))
			throw new TypeError('Invalid ID');
		if (opts?.resolver && typeof opts.resolver != 'function') {
			throw new TypeError(`Invalid resolver function for ID #${opts.id}`);
		}
		if (opts.resolver)
			this._resolver = opts.resolver;
		this.#id = opts.id ?? this.correlationId;
		if (typeof opts?.afterInit === 'function') {
			opts.afterInit(this.#id, (resolver: typeof opts.resolver) => {
				if (typeof resolver !== 'function') {
					throw new TypeError(`Invalid resolver function for Destination #${this.#id}`);
				}
				this._resolver = resolver;
				return this;
			});
		}
	}

	protected _addDataPacket(dataPacket: DataPacketType) {
		if (!this._resolver)
			return Promise.resolve(null);
		this.#_requestQueue.push(dataPacket);
		if (!this.#active)
			return Promise.resolve(null);
		return this._sendDataPacket();
	}

	protected _sendDataPacket(): Promise<null | ResolveResultType> {
		if (!this._resolver || !this.#_requestQueue.length)
			return Promise.resolve(null);
		const dataPacket = this.#_requestQueue.shift()!;
		return this._resolver(dataPacket, this)
			.then(
				(result) => {
					this.#_dataPacketQueue.push({ data: dataPacket, result });
					return result;
				},
			)
			.catch(
				(error) => {
					this.#_dataPacketQueue.push({ data: dataPacket, result: null, error });
					return null;
				},
			)
			.finally(() => {
				this.#currentCycle++;
				this.#totalCycles++;
			});
	}

	protected _isValidId(id: any): id is string {
		return typeof id === 'string' && id?.length > 0;
	}

	/**
	 * Consumes the next request in the queue when the current cycle completes
	 * @returns This destination instance
	 */
	protected async _consumeNextRequest() {
		if (this.#_requestQueue.length && this.isActive()) {
			await this._sendDataPacket();
			this._consumeNextRequest();
		}
		return this;
	}

	/**
	 * Start/resume data processing
	 * @returns This destination instance
	 */
	public start(): this {
		this.#active = true;
		this.#currentCycle = 0;
		this.#epoch++;
		this._consumeNextRequest();
		return this;
	}

	/**
	 * Stop/pause data processing
	 * @returns This destination instance
	 */
	public stop(): this {
		this.#active = false;
		return this;
	}

	/**
	 * Check if data processing is active
	 * @returns True if actively processing data
	 */
	public isActive(): boolean {
		return this.#active;
	}

	public send(data: DataPacketType): Promise<null | ResolveResultType> {
		if (!this._resolver)
			throw new EvalError(`Resolver not set for Destination #${this.#id}`);
		return this._addDataPacket(data);
	}

	public *requestEmitter() {
		while (true) {
			if (this.#_dataPacketQueue.length) {
				const c = this.#_dataPacketQueue.shift();
				yield (c === undefined) ? null : c;
			} else {
				yield null;
			}
		}
	}
}

export class NamedDataDestination<
	DataPacketType,
	ResolveResultType,
> extends AbstractAgnosticDataDestination<
		DataPacketType,
		ResolveResultType
	> {
	protected override _addDataPacket(dataPacket: DataPacketType): Promise<null | ResolveResultType> {
		return super._addDataPacket(Object.assign({}, dataPacket, { id: this.id }));
	}
}

export function createDataDestinationAdapter<
	EventType extends TAutomataBaseEventType = TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
	DataModel extends object | null = object | null,
	DataPacketType extends Record<string, any> = Record<string, any>,
	ResolveResultType = any,
	ErrorType = Error,
>() {
	return <BaseType extends TAbstractConstructor<
		AbstractAgnosticDataDestination<DataPacketType, ResolveResultType, ErrorType>
	> = TAbstractConstructor<
		AbstractAgnosticDataDestination<DataPacketType, ResolveResultType, ErrorType>
	>>(Base: BaseType) =>
		class AbstractAutomataDataDestination extends ExtendedEventContainer<
			EventType,
			EventMetaType
		>()(Base) implements IDataDestination<
			EventType,
			EventMetaType,
			DataModel,
			DataPacketType,
			ResolveResultType,
			ErrorType
		> {
			#eventTriggers: TDataBoundEventDictionary<EventType, EventMetaType, DataPacketType, DataModel> = {};

			getBoundEvents() {
				return Object.keys(this.#eventTriggers) as unknown as EventType[];
			}

			createTrigger(
				events: EventType[] | null,
				selector: TDataBoundSelector<EventType, EventMetaType, DataPacketType, DataModel>,
			): this {
				if (typeof selector !== 'function')
					throw new TypeError(`Invalid selector function provided in trigger for Data Destination #${this.id}`);
				if (events && !Array.isArray(events))
					throw new TypeError(`Invalid event types provided in trigger for Data Destination #${this.id}`);
				if (events) {
					for (const eventName of events) {
						if (!this.validateEvent(eventName))
							throw new TypeError(`Invalid event name for Data Destination #${this.id}`);
						this.#eventTriggers = Object.assign({}, this.#eventTriggers, { [eventName]: selector });
					}
				} else {
					this.#eventTriggers[WILDCARD_EVENT] = selector;
				}
				return this;
			}

			removeTrigger(events: EventType[] | null): this {
				if (events && !Array.isArray(events))
					throw new TypeError(`Invalid event types provided in trigger for Data Destination #${this.id}`);
				if (events) {
					for (const eventName of events) {
						if (typeof eventName !== 'string')
							throw new TypeError(`Invalid event name provided in trigger for Data Destination #${this.id}`);
						if (!this.validateEvent(eventName))
							throw new TypeError(`Invalid event name for Data Destination #${this.id}`);
						delete this.#eventTriggers[eventName];
					}
				} else {
					delete this.#eventTriggers[WILDCARD_EVENT];
				}
				return this;
			}

			getTriggers() {
				return this.#eventTriggers;
			}

			update(event: TAutomataEventMetaType<EventType, EventMetaType>, model?: DataModel) {
				if (!this.validateEventMeta(event))
					throw new TypeError(`Invalid event passed to Data Destination #${this.id}`);
				const selector = this.#eventTriggers[event.event] || this.#eventTriggers[WILDCARD_EVENT];
				if (!selector)
					return null;
				return selector(event, model);
			}
		};
}

export class BasicDataDestination extends createDataDestinationAdapter<
	TAutomataBaseEventType,
	Record<TAutomataBaseEventType, any>,
object,
Record<string, any>
>()(NamedDataDestination<Record<string, any>, any>) { }
export default BasicDataDestination;
