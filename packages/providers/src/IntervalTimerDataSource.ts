import {
	AbstractAgnosticDataSource,
	createDataSourceAdapter,
	TAutomataBaseEventType,
	TCycleIteratorInfo,
	TDataSourceConstructorOpts,
} from '@yantrix/automata';

/** @see {@link IntervalTimerDataSource} */
export type TIntervalTimerDataSourceDataPacket = {
	id: string;
	timestamp: number;
	startTimestamp: number;
} & TCycleIteratorInfo;

/** @see {@link IntervalTimerDataSource} */
export type TIntervalTimerDataSourceProps = TDataSourceConstructorOpts<TIntervalTimerDataSourceDataPacket> & {
	interval: number;
};

class IntervalTimer extends AbstractAgnosticDataSource<TIntervalTimerDataSourceDataPacket> {
	#intervalLink: ReturnType<typeof setInterval> | null = null;
	readonly #interval: number;
	#startTimestamp = 0;

	_isValidInterval(interval: any): interval is number {
		return Number.isFinite(interval) && Number.isInteger(interval) && interval > 0;
	}

	public constructor(opts: TIntervalTimerDataSourceProps) {
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

function adaptTimer<EventType extends TAutomataBaseEventType, EventMetaType extends Record<EventType, any>>() {
	return createDataSourceAdapter<EventType, EventMetaType, TIntervalTimerDataSourceDataPacket>()(IntervalTimer);
}

// The event types parameterize only the listeners. Every specialization uses the same timer constructor.
const TimerSource = adaptTimer() as {
	new<EventType extends TAutomataBaseEventType, EventMetaType extends Record<EventType, any>>(
		opts: TIntervalTimerDataSourceProps,
	): InstanceType<ReturnType<typeof adaptTimer<EventType, EventMetaType>>>;
};

/** @example `new IntervalTimerDataSource({ id: "clock", interval: 1000 })` */
export class IntervalTimerDataSource<
	EventType extends TAutomataBaseEventType = TAutomataBaseEventType,
	EventMetaType extends Record<EventType, any> = Record<EventType, any>,
> extends TimerSource<EventType, EventMetaType> {
	// A timer can restart while a consumer retains its packet iterator.
	override *dataEmitter() {
		while (true) {
			yield * super.dataEmitter();
		}
	}
}
