import { AutomataEventAdapter, TAutomataEventMetaType } from '@yantrix/core';
import { ClockEvents } from '../events/clockEvents';
import { actionsDictionary, statesDictionary } from '../generated/ClockAutomata';

export function buildAdapter(): AutomataEventAdapter {
	const adapter = new AutomataEventAdapter();

	// UI -> Actions
	adapter.addEventListener(ClockEvents.UI_UPDATE_INTERVALS, ({ meta }: TAutomataEventMetaType<ClockEvents>) => ({
		action: actionsDictionary.UpdateInput,
		payload: { startTs: meta?.startTs ?? null },
	}));

	adapter.addEventListener(ClockEvents.UI_APPLY, () => ({
		action: actionsDictionary.Apply,
		payload: {},
	}));

	adapter.addEventListener(ClockEvents.UI_START, () => ({
		action: actionsDictionary.Start,
		payload: {},
	}));

	adapter.addEventListener(ClockEvents.UI_STOP, () => ({ action: actionsDictionary.Stop, payload: {} }));
	adapter.addEventListener(ClockEvents.UI_RESET, () => ({ action: actionsDictionary.Reset, payload: {} }));

	// Timer tick -> Action
	adapter.addEventListener(ClockEvents.CLOCK_TICK, () => ({
		action: actionsDictionary.Tick,
		payload: {},
	}));

	// Entering Configuring/Paused -> stop all timers
	adapter.addEventEmitter(statesDictionary.Paused, () => ({ event: ClockEvents.CLOCK_TIMERS_STOP, meta: {} }));
	adapter.addEventEmitter(statesDictionary.Configuring, () => ({ event: ClockEvents.CLOCK_TIMERS_STOP, meta: {} }));

	// Request UI re-render on significant states
	[
		statesDictionary.Configuring,
		statesDictionary.Ticking,
		statesDictionary.Paused,
	].forEach((s) => {
		adapter.addEventEmitter(s, () => ({ event: ClockEvents.UI_RENDER, meta: {} }));
	});

	return adapter;
}
