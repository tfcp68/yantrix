import {
	CoreLoop,
	uniqId,
} from '@yantrix/core';

import { buildAdapter } from './clock/adapter';
import { bindControl } from './clock/control';

import { createClockTimersDestination, createClockTimersSource, TimersSet } from './clock/timers';
import { createDomSource } from './clock/ui/domSource';
import { bindUiRenderer } from './clock/ui/render';
import { ClockEvents, registerClockEvents, TClockMeta } from './events/clockEvents';
import ClockAutomata from './generated/ClockAutomata';

export function startClockCoreLoop(): void {
	registerClockEvents();

	const loop = new CoreLoop<ClockEvents, TClockMeta>();
	const bus = loop.getBus();

	const adapter = buildAdapter();
	const automata = new ClockAutomata();

	loop.registerAutomata(uniqId(), automata, adapter);
	loop.start();

	const timers: TimersSet = {};
	const dst = createClockTimersDestination(timers);
	const src = createClockTimersSource(timers);

	loop.registerDestination(dst);
	loop.registerSource(src);

	const unbindUi = bindUiRenderer(bus, automata);
	const domSource = createDomSource();

	loop.registerSource({
		id: domSource.id,
		start: publish => domSource.start(publish),
		stop: () => domSource.stop(),
	});

	const unbindControl = bindControl(bus, automata, adapter, timers);

	(window as any).stopClockDemo = () => {
		unbindUi();
		unbindControl();
		loop.stop();
	};
}

document.addEventListener('DOMContentLoaded', () => {
	startClockCoreLoop();
});
