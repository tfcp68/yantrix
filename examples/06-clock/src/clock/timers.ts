import {
	IAutomataEventBus,
	IntervalTimerDataSource,
	TAutomataEventMetaType,
	TEventBusHandler,
	uniqId,
} from '@yantrix/core';
import { ClockEvents, TClockMeta } from '../events/clockEvents';

const TICK_INTERVAL_MS = 100;

export type TimersSet = {
	tick?: IntervalTimerDataSource;
};

type TRestartEvent = TAutomataEventMetaType<ClockEvents.CLOCK_TIMERS_RESTART, TClockMeta>;
const isRestartEvent = (
	ev: TAutomataEventMetaType<ClockEvents, TClockMeta>,
): ev is TRestartEvent => ev.event === ClockEvents.CLOCK_TIMERS_RESTART;

type TStopEvent = TAutomataEventMetaType<ClockEvents.CLOCK_TIMERS_STOP, TClockMeta>;
const isStopEvent = (
	ev: TAutomataEventMetaType<ClockEvents, TClockMeta>,
): ev is TStopEvent => ev.event === ClockEvents.CLOCK_TIMERS_STOP;

export function createClockTimersDestination(timers: TimersSet) {
	return {
		id: uniqId(),
		bind(bus: IAutomataEventBus<ClockEvents, TClockMeta>) {
			const onRestart: TEventBusHandler<ClockEvents, TClockMeta> = (ev) => {
				if (!isRestartEvent(ev)) {
					return { event: ev.event, meta: ev.meta, task_id: uniqId(), result: Promise.resolve([]) };
				}

				timers.tick?.stop();
				timers.tick = new IntervalTimerDataSource({ id: `${uniqId()}_tick`, interval: TICK_INTERVAL_MS }).start();

				return { event: ev.event, meta: ev.meta, task_id: uniqId(), result: Promise.resolve([]) };
			};

			const onStop: TEventBusHandler<ClockEvents, TClockMeta> = (ev) => {
				if (!isStopEvent(ev)) {
					return { event: ev.event, meta: ev.meta, task_id: uniqId(), result: Promise.resolve([]) };
				}

				timers.tick?.stop();
				timers.tick = undefined;

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

export function createClockTimersSource(timers: TimersSet) {
	let rafId = 0;
	let lastTick: IntervalTimerDataSource | undefined;

	return {
		id: uniqId(),
		start(publish: (e: TAutomataEventMetaType<ClockEvents, TClockMeta>) => void) {
			const iter: { tick?: Generator } = {};

			const loop = () => {
				if (timers.tick !== lastTick) {
					lastTick = timers.tick;
					iter.tick = undefined;
				}

				if (!iter.tick && timers.tick && timers.tick.isActive()) iter.tick = timers.tick.dataEmitter();
				if (iter.tick) {
					let p = iter.tick.next();
					while (p.value) {
						publish({ event: ClockEvents.CLOCK_TICK, meta: {} });
						p = iter.tick.next();
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

export function hardStopTimers(timers: TimersSet): void {
	timers.tick?.stop();
	timers.tick = undefined;
}
