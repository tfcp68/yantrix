import { AutomataEventAdapter, TAutomataEventMetaType } from '@yantrix/core';
import { ClockEvents } from '../events/clockEvents';
import { actionsDictionary, statesDictionary } from '../generated/ClockAutomata';

/**
 * Build and configure the Event Adapter for the clock FSM.
 * - Subscribes UI and timer Events -> maps them to FSM Actions.
 * - Emits side Events on specific States (e.g., stop timers, request UI re-render).
 */
export function buildAdapter(): AutomataEventAdapter {
	const adapter = new AutomataEventAdapter();

	// UI -> Actions
	adapter.addEventListener(ClockEvents.UI_UPDATE_INTERVALS, ({ meta }: TAutomataEventMetaType<ClockEvents>) => ({
		action: actionsDictionary.UpdateInput,
		payload: { secMs: meta?.secMs ?? null, minMs: meta?.minMs ?? null, hourMs: meta?.hourMs ?? null },
	}));

	adapter.addEventListener(ClockEvents.UI_APPLY, ({ meta }: TAutomataEventMetaType<ClockEvents>) => ({
		action: actionsDictionary.Apply,
		payload: { secMs: meta?.secMs ?? null, minMs: meta?.minMs ?? null, hourMs: meta?.hourMs ?? null },
	}));

	adapter.addEventListener(ClockEvents.UI_START, ({ meta }: TAutomataEventMetaType<ClockEvents>) => ({
		action: actionsDictionary.Start,
		payload: { secMs: meta?.secMs ?? null, minMs: meta?.minMs ?? null, hourMs: meta?.hourMs ?? null },
	}));

	adapter.addEventListener(ClockEvents.UI_STOP, () => ({ action: actionsDictionary.Stop, payload: {} }));
	adapter.addEventListener(ClockEvents.UI_RESET, () => ({ action: actionsDictionary.Reset, payload: {} }));

	// Timer ticks -> Actions
	adapter.addEventListener(ClockEvents.CLOCK_TICK_SECOND, () => ({
		action: actionsDictionary.TickSecond,
		payload: {},
	}));
	adapter.addEventListener(ClockEvents.CLOCK_TICK_MINUTE, () => ({
		action: actionsDictionary.TickMinute,
		payload: {},
	}));
	adapter.addEventListener(ClockEvents.CLOCK_TICK_HOUR, () => ({
		action: actionsDictionary.TickHour,
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
		statesDictionary.TickSecond,
		statesDictionary.TickMinute,
		statesDictionary.TickHour,
	].forEach((s) => {
		adapter.addEventEmitter(s, () => ({ event: ClockEvents.UI_RENDER, meta: {} }));
	});

	return adapter;
}
