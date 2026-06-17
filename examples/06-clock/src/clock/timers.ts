import {
	createDataDestinationAdapter,
	createDataSourceAdapter,
	IntervalTimerDataSource,
	NamedDataDestination,
	NamedDataSource,
	TAutomataEventMetaType,
	uniqId,
} from '@yantrix/core';
import { ClockEvents, TClockMeta } from '../events/clockEvents';

const TICK_INTERVAL_MS = 100;

export type TimersSet = {
	tick?: IntervalTimerDataSource;
};

// ── Destination ───────────────────────────────────────────────────────────────
// Handles CLOCK_TIMERS_RESTART (creates a new IntervalTimerDataSource) and
// CLOCK_TIMERS_STOP (stops and clears it). Fire-and-forget — no follow-up event.

type TTimerPacket = { kind: 'restart' | 'stop' };

const TimerDstBase = createDataDestinationAdapter<ClockEvents, TClockMeta, null, TTimerPacket, void>()(
	NamedDataDestination<TTimerPacket, void>,
);

export function createClockTimersDestination(timers: TimersSet) {
	const dst = new TimerDstBase({
		id: `clock_timer_dst_${uniqId()}`,
		resolver: async (packet: TTimerPacket) => {
			if (packet.kind === 'restart') {
				timers.tick?.stop();
				timers.tick = new IntervalTimerDataSource({ id: `tick_${uniqId()}`, interval: TICK_INTERVAL_MS });
				timers.tick.start();
			} else {
				timers.tick?.stop();
				timers.tick = undefined;
			}
		},
	});
	dst.createTrigger([ClockEvents.CLOCK_TIMERS_RESTART], () => ({ kind: 'restart' }));
	dst.createTrigger([ClockEvents.CLOCK_TIMERS_STOP], () => ({ kind: 'stop' }));
	return dst;
}

// ── Source ────────────────────────────────────────────────────────────────────
// Emits CLOCK_TICK events by bridging the dynamic IntervalTimerDataSource through
// a requestAnimationFrame loop. Each RAF frame drains all pending timer packets
// and pushes them into this Data Source queue.
// The source only enqueues; CoreLoop drains it on its tick.

type TTickPacket = Record<string, never>;

const TimerSrcBase = createDataSourceAdapter<ClockEvents, TClockMeta, TTickPacket>()(NamedDataSource<TTickPacket>);

class ClockTimersDataSource extends TimerSrcBase {
	readonly #timers: TimersSet;
	#rafId = 0;
	#lastTick: IntervalTimerDataSource | undefined;
	#tickIter: ReturnType<IntervalTimerDataSource['dataEmitter']> | undefined;

	constructor(timers: TimersSet) {
		super({ id: `clock_timer_src_${uniqId()}` });
		this.#timers = timers;
		this.addListener('emit', (_p: TTickPacket): [TAutomataEventMetaType<ClockEvents.CLOCK_TICK, TClockMeta>] => [
			{ event: ClockEvents.CLOCK_TICK, meta: {} },
		]);
	}

	override start(): this {
		super.start();
		const loop = () => {
			if (this.#timers.tick !== this.#lastTick) {
				this.#lastTick = this.#timers.tick;
				this.#tickIter = undefined;
			}
			if (!this.#tickIter && this.#timers.tick?.isActive()) {
				this.#tickIter = this.#timers.tick.dataEmitter();
			}
			if (this.#tickIter) {
				let p = this.#tickIter.next();
				while (p.value) {
					this._addDataPacket({});
					p = this.#tickIter.next();
				}
			}
			this.#rafId = requestAnimationFrame(loop);
		};
		this.#rafId = requestAnimationFrame(loop);
		return this;
	}

	override stop(): this {
		if (this.#rafId) cancelAnimationFrame(this.#rafId);
		this.#rafId = 0;
		return super.stop();
	}
}

export function createClockTimersSource(timers: TimersSet) {
	return new ClockTimersDataSource(timers);
}

export function hardStopTimers(timers: TimersSet): void {
	timers.tick?.stop();
	timers.tick = undefined;
}
