import { EventDictionary as GlobalEventDictionary } from '@yantrix/core';

export enum ClockEvents {
	UI_UPDATE_INTERVALS = 1,
	UI_APPLY = 2,
	UI_START = 3,
	UI_STOP = 4,
	UI_RESET = 5,
	CLOCK_TIMERS_RESTART = 6,
	CLOCK_TIMERS_STOP = 7,
	CLOCK_TICK_SECOND = 8,
	CLOCK_TICK_MINUTE = 9,
	CLOCK_TICK_HOUR = 10,
	UI_RENDER = 11,
}

export type TClockMeta = {
	[ClockEvents.UI_UPDATE_INTERVALS]: { secMs?: number; minMs?: number; hourMs?: number };
	[ClockEvents.UI_APPLY]: object;
	[ClockEvents.UI_START]: object;
	[ClockEvents.UI_STOP]: object;
	[ClockEvents.UI_RESET]: object;
	[ClockEvents.CLOCK_TIMERS_RESTART]: { secMs: number; minMs: number; hourMs: number };
	[ClockEvents.CLOCK_TIMERS_STOP]: object;
	[ClockEvents.CLOCK_TICK_SECOND]: { ts: number };
	[ClockEvents.CLOCK_TICK_MINUTE]: { ts: number };
	[ClockEvents.CLOCK_TICK_HOUR]: { ts: number };
	[ClockEvents.UI_RENDER]: object;
};

export function registerClockEvents(): void {
	GlobalEventDictionary.addEvents({
		keys: [
			'ui/updateIntervals',
			'ui/apply',
			'ui/start',
			'ui/stop',
			'ui/reset',
			'clock/timersRestart',
			'clock/timersStop',
			'clock/tickSecond',
			'clock/tickMinute',
			'clock/tickHour',
			'ui/render',
		],
	});
}
