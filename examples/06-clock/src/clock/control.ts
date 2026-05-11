import { AutomataEventAdapter, IAutomataEventBus, TEventBusHandler, uniqId } from '@yantrix/core';
import { ClockEvents, TClockMeta } from '../events/clockEvents';
import ClockAutomata, { actionsDictionary, statesDictionary } from '../generated/ClockAutomata';
import { hardStopTimers, TimersSet } from './timers';

export function bindControl(
	bus: IAutomataEventBus<ClockEvents, TClockMeta>,
	automata: ClockAutomata,
	adapter: AutomataEventAdapter,
	timers: TimersSet,
): () => void {
	const hStart: TEventBusHandler<ClockEvents, TClockMeta> = (e) => {
		if (e.event !== ClockEvents.UI_START) {
			return { event: e.event!, meta: e.meta, task_id: uniqId(), result: Promise.resolve([]) };
		}
		return {
			event: e.event!,
			meta: e.meta,
			task_id: `${uniqId()}_ui_start_restart_timers`,
			result: Promise.resolve([{ event: ClockEvents.CLOCK_TIMERS_RESTART, meta: {} }]),
		};
	};

	const hReset: TEventBusHandler<ClockEvents, TClockMeta> = (e) => {
		if (e.event !== ClockEvents.UI_RESET) {
			return { event: e.event!, meta: e.meta, task_id: uniqId(), result: Promise.resolve([]) };
		}

		hardStopTimers(timers);
		bus.clearEventStack();

		automata.dispatch({ action: actionsDictionary.Reset, payload: {} });

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
