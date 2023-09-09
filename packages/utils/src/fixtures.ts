import { microtime } from './isomorphic.js';
import { TLengthArray } from './types.js';

export function sampleRange(min = 1, max = 100) {
	return min + Math.floor(Math.random() * (max - min + 1));
}

export function pickFromArray<T>(arr: T[], n = 1): T[] {
	const acc: T[] = [];
	if (!arr?.length || n <= 0) return acc;
	const a = JSON.parse(JSON.stringify(arr));
	while (acc.length < n)
		acc.push(...a.splice(Math.floor(Math.random() * a.length), 1));
	return acc;
}

export function popFromArray<T>(arr: T[], n = 1): T[] {
	const acc: T[] = [];
	if (!arr?.length || n <= 0) return acc;
	let i = 0;
	while (i++ < n) {
		const v = arr.pop();
		// eslint-disable-next-line eqeqeq
		if (v == null) break;
		acc.push(v);
	}
	return acc;
}

export function sampleArray<T = number, N extends number = number>(
	item: null | ((index?: number) => T) | T,
	n: N,
) {
	if (item === null)
		return Array(n)
			.fill(null)
			.map((_, ix) => ix + 1) as TLengthArray<T, N>;
	if (item instanceof Function)
		return Array(n)
			.fill(null)
			.map((_, ix) => item(ix)) as TLengthArray<T, N>;
	return Array(n).fill(item) as TLengthArray<T, N>;
}

/**
 * Generate a random alphanumeric ID of a given length.
 * @param {number} length
 * @return {string}
 */
export function uniqId(length = 10) {
	const key = [...microtime().toString(36)];
	while (key.length < length)
		key.push(...Math.random().toString(36).slice(2));
	return key.slice(length).join('').toUpperCase();
}
