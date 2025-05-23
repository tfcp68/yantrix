import { IAgnosticDataSource, IDataSource } from "./types/interfaces";
import { TAbstractConstructor, TAutomataBaseEventType, TAutomataEventStack, TCycleIteratorInfo, TDataSourceConstructorOpts } from "./types";
import ExtendedEventContainer from "./mixins/ExtendedEventContainer";
import { AbstractBaseClass } from "./mixins/BaseClass";

export abstract class AbstractAgnosticDataSource<T> extends AbstractBaseClass implements IAgnosticDataSource<T> {
    #_dataPacketQueue: T[] = [];
    #active = false;
    #currentCycle = 0;
    #totalCycles = 0;
    #epoch = 0;
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
            currentEpoch: this.currentEpoch
        };
    }

    protected _isValidId(id: any): id is string {
        return id === undefined || id === null || typeof id === 'string' && id?.length > 0
    }

    public constructor(opts: TDataSourceConstructorOpts<T>) {
        super();
        if (!this._isValidId(opts?.id))
            throw new TypeError("Invalid ID")
        this.#id = opts.id || this.correlationId;
        this.start();
        if (typeof opts?.afterInit === 'function')
            opts.afterInit(this.id, (data: T) => this._addDataPacket(data));
        else if (opts?.afterInit)
            throw new TypeError(`Invalid afterInit function for Data Source #${this.id}`);
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
        if (t == undefined) return null;
        return t;
    }

    public *dataEmitter() {
        while (true) {
            if (!this.isActive())
                yield null;
            else
                if (this.#_dataPacketQueue.length) {
                    yield this._getDataPacket();
                }
                else
                    yield null;
        }
    }
}

type TIntervalTimerDataSourceDataPacket = {
    id: string;
    timestamp: number;
    startTimestamp: number;
} & TCycleIteratorInfo;
export class IntervalTimerDataSource extends AbstractAgnosticDataSource<TIntervalTimerDataSourceDataPacket> {
    #interval: any = null;
    #startTimestamp = 0;

    protected _isValidInterval(interval: any): interval is number {
        return Number.isFinite(interval) && Number.isInteger(interval) && interval > 0;
    }

    public constructor(opts: TDataSourceConstructorOpts<TIntervalTimerDataSourceDataPacket> & { interval: number }) {
        super(opts);
        if (!this._isValidInterval(opts.interval))
            throw new RangeError(`Invalid timer interval for Data Source #${this.id}`);
        this.#interval = opts.interval;
        this.start();
    }


    override start(): this {
        super.start();
        this.#startTimestamp = Date.now();
        if (this.#interval != null)
            clearInterval(this.#interval);
        this.#interval = setInterval(() => this._addDataPacket({
            id: this.id,
            startTimestamp: this.#startTimestamp,
            timestamp: Date.now(),
            ...this._getCycleIteratorInfo()
        }), this.#interval);
        return this;
    }

    override stop(): this {
        super.stop();
        if (this.#interval != null) {
            clearInterval(this.#interval);
            this.#interval = null;
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
    return <BaseType extends TAbstractConstructor<AbstractAgnosticDataSource<DataPacketType>> = TAbstractConstructor<AbstractAgnosticDataSource<DataPacketType>>>(Base: BaseType) =>
        class AbstractAutomataDataSource extends ExtendedEventContainer<
            EventType,
            EventMetaType
        >()(Base) implements IDataSource<EventType, EventMetaType, DataPacketType> {

            #eventListeners: Partial<{
                [id: string]: [
                    (data: DataPacketType) => TAutomataEventStack<EventType, EventMetaType>,
                    null | ((...events: TAutomataEventStack<EventType, EventMetaType>) => any)
                ]
            }> = {};

            addListener(
                id: string,
                transform: (data: DataPacketType) => TAutomataEventStack<EventType, EventMetaType>,
                dispatch?: (...events: TAutomataEventStack<EventType, EventMetaType>) => any
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

            protected getBoundEvents() {
                return Object.keys(this.#eventListeners) as string[];
            }

            *eventEmitter(): IterableIterator<TAutomataEventStack<EventType, EventMetaType>> {
                const dataEmitter = this.dataEmitter();
                let allEvents: TAutomataEventStack<EventType, EventMetaType> = [];
                for (const dataPacket of dataEmitter) {
                    allEvents = [];
                    if (dataPacket) {
                        for (const id of this.getBoundEvents()) {
                            const [transform, dispatch] = this.#eventListeners[id]!;
                            const events = transform(dataPacket);
                            allEvents = allEvents.concat(events);
                            if (dispatch) {
                                dispatch(...events);
                            }
                        }
                        yield allEvents;
                    }
                    continue;
                }
            }
        };
}

export class BasicDataSource extends createDataSourceAdapter<TAutomataBaseEventType, Record<TAutomataBaseEventType, any>, object>()(NamedDataSource<object>) { }
export default BasicDataSource;