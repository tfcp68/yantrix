import { AutomataEventAdapter, IAutomataEventBus, TEventBusHandler, uniqId } from '@yantrix/core';
import { ClockEvents, TClockMeta } from '../events/clockEvents';
import ClockAutomata, { actionsDictionary, statesDictionary } from '../generated/ClockAutomata';
import { hardStopTimers, TimersSet } from './timers';

/**
 * Control layer: side effects for Start (timers restart) and Reset.
 * Note: Handlers are typed as TEventBusHandler<ClockEvents, TClockMeta> to satisfy EventBus.subscribe signature.
 */
export function bindControl(
	bus: IAutomataEventBus<ClockEvents, TClockMeta>,
	automata: ClockAutomata,
	adapter: AutomataEventAdapter,
	timers: TimersSet,
): () => void {
	const mkIntervals = (eMeta: any) => {
		const c: any = automata.getContext?.().context ?? {};
		const secMs = Math.max(1, Math.round((eMeta?.secMs ?? c?.secMs ?? 1000)));
		const minMs = Math.max(1, Math.round((eMeta?.minMs ?? c?.minMs ?? 60000)));
		const hourMs = Math.max(1, Math.round((eMeta?.hourMs ?? c?.hourMs ?? 3600000)));
		return { secMs, minMs, hourMs };
	};

	// Start: restart timers using the latest values (typed to match EventBus handler signature)
	const hStart: TEventBusHandler<ClockEvents, TClockMeta> = (e) => {
		// This handler is subscribed to UI_START only, but the type is the generic bus event.
		if (e.event !== ClockEvents.UI_START) {
			return { event: e.event!, meta: e.meta, task_id: uniqId(), result: Promise.resolve([]) };
		}
		const { secMs, minMs, hourMs } = mkIntervals(e.meta);
		return {
			event: e.event!,
			meta: e.meta,
			task_id: `${uniqId()}_ui_start_restart_timers`,
			result: Promise.resolve([{ event: ClockEvents.CLOCK_TIMERS_RESTART, meta: { secMs, minMs, hourMs } }]),
		};
	};

	// Reset: stop timers, clear pending ticks, reset FSM, ensure zero angles, re-render
	const hReset: TEventBusHandler<ClockEvents, TClockMeta> = (e) => {
		if (e.event !== ClockEvents.UI_RESET) {
			return { event: e.event!, meta: e.meta, task_id: uniqId(), result: Promise.resolve([]) };
		}

		// Stop and invalidate timers
		hardStopTimers(timers);
		// Drop any queued source events
		bus.clearEventStack();

		// Reset FSM synchronously
		automata.dispatch({ action: actionsDictionary.Reset, payload: {} });

		// Safety: force zero angles if generator didn't
		const ctx = automata.getContext?.();
		const c: any = ctx?.context ?? {};
		const needsFix
			= (Number(c?.hourAngle ?? 0) !== 0)
			|| (Number(c?.minuteAngle ?? 0) !== 0)
			|| (Number(c?.secondAngle ?? 0) !== 0);

		if (needsFix) {
			(automata).setContext({
				state: statesDictionary.Configuring,
				context: Object.assign({}, c, { hourAngle: 0, minuteAngle: 0, secondAngle: 0 }),
			});
		}

		// Emit adapter transition events and repaint
		const emitted = adapter.handleTransition(automata.getContext()) ?? [];
		if (emitted.length) bus.dispatch(...(emitted));
		bus.dispatch({ event: ClockEvents.UI_RENDER, meta: {} });

		return {
			event: e.event!,
			meta: e.meta,
			task_id: uniqId(),
			result: null,
		};
	};

	bus.subscribe(ClockEvents.UI_START, hStart);
	bus.subscribe(ClockEvents.UI_RESET, hReset);

	return () => {
		bus.unsubscribe(ClockEvents.UI_START, hStart);
		bus.unsubscribe(ClockEvents.UI_RESET, hReset);
	};
}
