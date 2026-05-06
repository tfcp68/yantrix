import { EventDictionary as GlobalEventDictionary } from '@yantrix/core';

export enum ClockEvents {
	UI_UPDATE_INTERVALS = 1,
	UI_APPLY = 2,
	UI_START = 3,
	UI_STOP = 4,
	UI_RESET = 5,
	CLOCK_TIMERS_RESTART = 6,
	CLOCK_TIMERS_STOP = 7,
	CLOCK_TICK = 8,
	UI_RENDER = 9,
}

export type TClockMeta = {
	[ClockEvents.UI_UPDATE_INTERVALS]: { startTs?: number };
	[ClockEvents.UI_APPLY]: object;
	[ClockEvents.UI_START]: object;
	[ClockEvents.UI_STOP]: object;
	[ClockEvents.UI_RESET]: object;
	[ClockEvents.CLOCK_TIMERS_RESTART]: object;
	[ClockEvents.CLOCK_TIMERS_STOP]: object;
	[ClockEvents.CLOCK_TICK]: object;
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
			'clock/tick',
			'ui/render',
		],
	});
}
