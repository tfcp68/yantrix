import {
	IAutomataEventBus,
	IntervalTimerDataSource,
	TAutomataEventMetaType,
	TEventBusHandler,
	uniqId,
} from '@yantrix/core';
import { ClockEvents, TClockMeta } from '../events/clockEvents';

/**
 * Runtime timer holders used by the clock data sources.
 */
export type TimersSet = {
	sec?: IntervalTimerDataSource;
	min?: IntervalTimerDataSource;
	hour?: IntervalTimerDataSource;
};

/**
 * Type guards to refine EventBus handler input to a specific Clock event.
 */
type TRestartEvent = TAutomataEventMetaType<ClockEvents.CLOCK_TIMERS_RESTART, TClockMeta>;
const isRestartEvent = (
	ev: TAutomataEventMetaType<ClockEvents, TClockMeta>,
): ev is TRestartEvent => ev.event === ClockEvents.CLOCK_TIMERS_RESTART;

type TStopEvent = TAutomataEventMetaType<ClockEvents.CLOCK_TIMERS_STOP, TClockMeta>;
const isStopEvent = (
	ev: TAutomataEventMetaType<ClockEvents, TClockMeta>,
): ev is TStopEvent => ev.event === ClockEvents.CLOCK_TIMERS_STOP;

/**
 * Event-bus destination: reacts to timer control events and manages IntervalTimerDataSource instances.
 * Strongly typed handlers (no `as any`).
 */
export function createClockTimersDestination(timers: TimersSet) {
	return {
		id: uniqId(),
		bind(bus: IAutomataEventBus<ClockEvents, TClockMeta>) {
			const onRestart: TEventBusHandler<ClockEvents, TClockMeta> = (ev) => {
				if (!isRestartEvent(ev)) {
					return { event: ev.event, meta: ev.meta, task_id: uniqId(), result: Promise.resolve([]) };
				}

				// Stop existing timers first
				timers.sec?.stop();
				timers.min?.stop();
				timers.hour?.stop();

				const secMs = Math.max(1, Math.round(ev.meta?.secMs ?? 1000));
				const minMs = Math.max(1, Math.round(ev.meta?.minMs ?? 60000));
				const hourMs = Math.max(1, Math.round(ev.meta?.hourMs ?? 3600000));

				// Create new timers with unique IDs to avoid collisions
				timers.sec = new IntervalTimerDataSource({ id: `${uniqId()}_sec`, interval: secMs }).start();
				timers.min = new IntervalTimerDataSource({ id: `${uniqId()}_min`, interval: minMs }).start();
				timers.hour = new IntervalTimerDataSource({ id: `${uniqId()}_hour`, interval: hourMs }).start();

				return { event: ev.event, meta: ev.meta, task_id: uniqId(), result: Promise.resolve([]) };
			};

			/**
			 * Handle CLOCK_TIMERS_STOP: stop and invalidate all timers.
			 */
			const onStop: TEventBusHandler<ClockEvents, TClockMeta> = (ev) => {
				if (!isStopEvent(ev)) {
					return { event: ev.event, meta: ev.meta, task_id: uniqId(), result: Promise.resolve([]) };
				}

				timers.sec?.stop();
				timers.min?.stop();
				timers.hour?.stop();
				timers.sec = undefined;
				timers.min = undefined;
				timers.hour = undefined;

				return { event: ev.event, meta: ev.meta, task_id: uniqId(), result: Promise.resolve([]) };
			};

			bus.subscribe(ClockEvents.CLOCK_TIMERS_RESTART, onRestart);
			bus.subscribe(ClockEvents.CLOCK_TIMERS_STOP, onStop);

			return () => {
				bus.unsubscribe(ClockEvents.CLOCK_TIMERS_RESTART, onRestart);
				bus.unsubscribe(ClockEvents.CLOCK_TIMERS_STOP, onStop);
			};
		},
	};
}

/**
 * Event-bus source: drains timer generators and publishes CLOCK_TICK_* events.
 */
export function createClockTimersSource(timers: TimersSet) {
	let rafId = 0;
	let lastSec: IntervalTimerDataSource | undefined;
	let lastMin: IntervalTimerDataSource | undefined;
	let lastHour: IntervalTimerDataSource | undefined;

	return {
		id: uniqId(),
		start(publish: (e: TAutomataEventMetaType<ClockEvents, TClockMeta>) => void) {
			const iter: {
				sec?: Generator;
				min?: Generator;
				hour?: Generator;
			} = {};

			const loop = () => {
				// Rebind iterators if timer instances change
				if (timers.sec !== lastSec) {
					lastSec = timers.sec;
					iter.sec = undefined;
				}
				if (timers.min !== lastMin) {
					lastMin = timers.min;
					iter.min = undefined;
				}
				if (timers.hour !== lastHour) {
					lastHour = timers.hour;
					iter.hour = undefined;
				}

				// Drain second ticks
				if (!iter.sec && timers.sec && timers.sec.isActive()) iter.sec = timers.sec.dataEmitter();
				if (iter.sec) {
					let p = iter.sec.next();
					while (p.value) {
						publish({ event: ClockEvents.CLOCK_TICK_SECOND, meta: { ts: Date.now() } });
						p = iter.sec.next();
					}
				}

				// Drain minute ticks
				if (!iter.min && timers.min && timers.min.isActive()) iter.min = timers.min.dataEmitter();
				if (iter.min) {
					let p = iter.min.next();
					while (p.value) {
						publish({ event: ClockEvents.CLOCK_TICK_MINUTE, meta: { ts: Date.now() } });
						p = iter.min.next();
					}
				}

				// Drain hour ticks
				if (!iter.hour && timers.hour && timers.hour.isActive()) iter.hour = timers.hour.dataEmitter();
				if (iter.hour) {
					let p = iter.hour.next();
					while (p.value) {
						publish({ event: ClockEvents.CLOCK_TICK_HOUR, meta: { ts: Date.now() } });
						p = iter.hour.next();
					}
				}

				rafId = requestAnimationFrame(loop);
			};

			rafId = requestAnimationFrame(loop);
		},
		stop() {
			if (rafId) cancelAnimationFrame(rafId);
			rafId = 0;
		},
	};
}

/**
 * Stop and invalidate all running timers.
 */
export function hardStopTimers(timers: TimersSet): void {
	timers.sec?.stop();
	timers.min?.stop();
	timers.hour?.stop();
	timers.sec = undefined;
	timers.min = undefined;
	timers.hour = undefined;
}
