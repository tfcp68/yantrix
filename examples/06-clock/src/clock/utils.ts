export const $ = <T extends HTMLElement>(id: string): T | null =>
	document.getElementById(id) as T | null;

export function parseMs(input: HTMLInputElement | null, fallbackMs: number): number {
	if (!input) return fallbackMs;
	const v = Number(input.value);
	if (!Number.isFinite(v) || v <= 0) return fallbackMs;
	return Math.round(v * 1000);
}

export function toDigitalTime(hourAngle: number, minuteAngle: number, secondAngle: number): {
	hh: string;
	mm: string;
	ss: string;
} {
	const hours = ((hourAngle / 30) % 12 + 12) % 12;
	const minutes = ((minuteAngle / 6) % 60 + 60) % 60;
	const seconds = ((secondAngle / 6) % 60 + 60) % 60;
	const hh = String(Math.floor(hours)).padStart(2, '0');
	const mm = String(Math.floor(minutes)).padStart(2, '0');
	const ss = String(Math.floor(seconds)).padStart(2, '0');
	return { hh, mm, ss };
}
