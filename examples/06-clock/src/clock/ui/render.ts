import { IAutomataEventBus } from '@yantrix/core';
import { ClockEvents } from '../../events/clockEvents';
import ClockAutomata, { statesDictionary } from '../../generated/ClockAutomata';
import { $, toDigitalTime } from '../utils';

function stateNameFromId(id: number | null): string {
	return Object.keys(statesDictionary).find(
		k => (statesDictionary as Record<string, number>)[k] === id,
	) || String(id);
}

export function bindUiRenderer(
	bus: IAutomataEventBus<ClockEvents, any>,
	automata: ClockAutomata,
): () => void {
	const handler = () => {
		const stateLabel = $('stateLabel');
		const statusText = $('statusText');
		const startBtn = $('startBtn') as HTMLButtonElement | null;
		const stopBtn = $('stopBtn') as HTMLButtonElement | null;
		const digitalTime = $('digitalTime');

		const name = stateNameFromId(automata.state);
		if (stateLabel) stateLabel.textContent = `State: ${name}`;

		const c: any = automata.getContext?.().context ?? {};
		const hourAngle = Number(c?.hourAngle ?? 0);
		const minuteAngle = Number(c?.minuteAngle ?? 0);
		const secondAngle = Number(c?.secondAngle ?? 0);

		const hourAngleText = $('hourAngleText');
		const minuteAngleText = $('minuteAngleText');
		const secondAngleText = $('secondAngleText');
		if (hourAngleText) hourAngleText.textContent = String(Math.round(hourAngle % 360));
		if (minuteAngleText) minuteAngleText.textContent = String(Math.round(minuteAngle % 360));
		if (secondAngleText) secondAngleText.textContent = String(Math.round(secondAngle % 360));

		const hourHand = $('hourHand') as HTMLDivElement | null;
		const minuteHand = $('minuteHand') as HTMLDivElement | null;
		const secondHand = $('secondHand') as HTMLDivElement | null;
		if (hourHand) hourHand.style.transform = `translateX(-50%) rotate(${hourAngle}deg)`;
		if (minuteHand) minuteHand.style.transform = `translateX(-50%) rotate(${minuteAngle}deg)`;
		if (secondHand) secondHand.style.transform = `translateX(-50%) rotate(${secondAngle}deg)`;

		const { hh, mm, ss } = toDigitalTime(hourAngle, minuteAngle, secondAngle);
		if (digitalTime) digitalTime.textContent = `${hh}:${mm}:${ss}`;

		const isTicking = automata.state === statesDictionary.Ticking;
		if (statusText) statusText.textContent = isTicking ? 'Running' : (automata.state === statesDictionary.Paused ? 'Paused' : 'Configuring');

		if (startBtn) {
			startBtn.disabled = isTicking;
			startBtn.classList.toggle('primary', !startBtn.disabled);
		}
		if (stopBtn) stopBtn.disabled = !isTicking;
	};

	bus.subscribe(ClockEvents.UI_RENDER, handler as any);
	handler();
	return () => bus.unsubscribe(ClockEvents.UI_RENDER, handler as any);
}
