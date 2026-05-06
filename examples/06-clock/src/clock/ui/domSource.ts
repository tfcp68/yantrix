import { TAutomataEventMetaType, uniqId } from '@yantrix/core';
import { ClockEvents, TClockMeta } from '../../events/clockEvents';
import { $ } from '../utils';

export function createDomSource(): {
	id: string;
	start: (publish: (e: TAutomataEventMetaType<ClockEvents, TClockMeta>) => void) => void;
	stop: () => void;
} {
	const listeners: Array<() => void> = [];
	const id = uniqId();

	const applyBtn = $('applyBtn') as HTMLButtonElement | null;
	const startBtn = $('startBtn') as HTMLButtonElement | null;
	const stopBtn = $('stopBtn') as HTMLButtonElement | null;
	const resetBtn = $('resetBtn') as HTMLButtonElement | null;

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
			on(applyBtn, 'click', () => {
				publish({ event: ClockEvents.UI_APPLY, meta: {} });
			});

			on(startBtn, 'click', () => {
				publish({ event: ClockEvents.UI_APPLY, meta: {} });
				publish({ event: ClockEvents.UI_START, meta: {} });
			});

			on(stopBtn, 'click', () => publish({ event: ClockEvents.UI_STOP, meta: {} }));
			on(resetBtn, 'click', () => publish({ event: ClockEvents.UI_RESET, meta: {} }));
		},
		stop() {
			listeners.splice(0).forEach(u => u());
		},
	};
}
