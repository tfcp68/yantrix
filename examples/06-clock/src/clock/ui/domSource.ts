import { createDataSourceAdapter, NamedDataSource, TAutomataEventMetaType, uniqId } from '@yantrix/core';
import { ClockEvents, TClockMeta } from '../../events/clockEvents';
import { $ } from '../utils';

type TDomPacket = { ev: TAutomataEventMetaType<ClockEvents, TClockMeta> };

const DomSrcBase = createDataSourceAdapter<ClockEvents, TClockMeta, TDomPacket>()(NamedDataSource<TDomPacket>);

/**
 * DOM source: converts button-click interactions into EventBus events.
 * A real IDataSource — button handlers push packets via `_addDataPacket`,
 * which calls the inherited `_notify` and wakes CoreLoop. No publish callback.
 */
class ClockDomSource extends DomSrcBase {
	#listeners: Array<() => void> = [];

	constructor() {
		super({ id: `clock_dom_${uniqId()}` });
		this.addListener('emit', (p: TDomPacket) => [p.ev]);
	}

	override start(): this {
		super.start();

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
			this.#listeners.push(() => el.removeEventListener(type, cb as any));
		};

		on(applyBtn, 'click', () => {
			this._addDataPacket({ ev: { event: ClockEvents.UI_APPLY, meta: {} } });
		});
		on(startBtn, 'click', () => {
			this._addDataPacket({ ev: { event: ClockEvents.UI_APPLY, meta: {} } });
			this._addDataPacket({ ev: { event: ClockEvents.UI_START, meta: {} } });
		});
		on(stopBtn, 'click', () => {
			this._addDataPacket({ ev: { event: ClockEvents.UI_STOP, meta: {} } });
		});
		on(resetBtn, 'click', () => {
			this._addDataPacket({ ev: { event: ClockEvents.UI_RESET, meta: {} } });
		});

		return this;
	}

	override stop(): this {
		this.#listeners.splice(0).forEach(u => u());
		return super.stop();
	}
}

export function createDomSource() {
	return new ClockDomSource();
}
