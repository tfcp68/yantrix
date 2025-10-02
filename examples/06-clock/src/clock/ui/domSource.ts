import { TAutomataEventMetaType, uniqId } from '@yantrix/core';
import { ClockEvents, TClockMeta } from '../../events/clockEvents';
import { $, parseMs } from '../utils';

/**
 * DOM source: converts user interactions into EventBus events.
 */
export function createDomSource(): {
	id: string;
	start: (publish: (e: TAutomataEventMetaType<ClockEvents, TClockMeta>) => void) => void;
	stop: () => void;
} {
	const listeners: Array<() => void> = [];
	const id = uniqId();

	const secInput = $('secInterval') as HTMLInputElement | null;
	const minInput = $('minInterval') as HTMLInputElement | null;
	const hourInput = $('hourInterval') as HTMLInputElement | null;
	const applyBtn = $('applyBtn') as HTMLButtonElement | null;
	const startBtn = $('startBtn') as HTMLButtonElement | null;
	const stopBtn = $('stopBtn') as HTMLButtonElement | null;
	const resetBtn = $('resetBtn') as HTMLButtonElement | null;

	const readIntervals = () => ({
		secMs: parseMs(secInput, 1000),
		minMs: parseMs(minInput, 60000),
		hourMs: parseMs(hourInput, 3600000),
	});

	const on = <K extends keyof HTMLElementEventMap>(
		el: HTMLElement | null,
		type: K,
		cb: (ev: HTMLElementEventMap[K]) => void,
	) => {
		if (!el) return;
		el.addEventListener(type, cb as any);
		listeners.push(() => el.removeEventListener(type, cb as any));
	};

	return {
		id,
		start(publish) {
			const emitIntervals = () =>
				publish({
					event: ClockEvents.UI_UPDATE_INTERVALS,
					meta: readIntervals(),
				});

			on(secInput, 'input', emitIntervals);
			on(minInput, 'input', emitIntervals);
			on(hourInput, 'input', emitIntervals);

			on(applyBtn, 'click', () => {
				publish({ event: ClockEvents.UI_UPDATE_INTERVALS, meta: readIntervals() });
			});

			on(startBtn, 'click', () => {
				const meta = readIntervals();
				publish({ event: ClockEvents.UI_APPLY, meta });
				publish({ event: ClockEvents.UI_START, meta });
			});

			on(stopBtn, 'click', () => publish({ event: ClockEvents.UI_STOP, meta: {} }));
			on(resetBtn, 'click', () => publish({ event: ClockEvents.UI_RESET, meta: {} }));

			emitIntervals();
		},
		stop() {
			listeners.splice(0).forEach(u => u());
		},
	};
}
