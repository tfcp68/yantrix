import { microtime } from './isomorphic.js';
import { TLengthArray } from './types.js';

export function randomString(length: number = 10) {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

export function randomInteger(min: number = 1, max: number = 100): number {
	return Math.floor(Math.random() * (max - min)) + min;
}

export const randomDecimal = (min: number = -10000, max: number = 10000) => Math.random() * (max - min) + min;

export function randomValueFunction() {
	const randomValueFunctions = [randomString, randomInteger, randomDecimal];
	const randomIndex = Math.floor(Math.random() * randomValueFunctions.length);
	return randomValueFunctions[randomIndex]!;
}
export function randomValue(): number | string {
	return randomValueFunction()();
}
export function randomArray(valueType: () => any, amount: number = randomInteger(1, 20)) {
	return Array.from({ length: amount }, valueType);
}

export function sampleRange(min = 1, max = 100) {
	return min + Math.floor(Math.random() * (max - min + 1));
}

export function pickFromArray<T>(arr: T[], n = 1): T[] {
	const acc: T[] = [];
	if (!arr?.length || n <= 0)
		return acc;
	const a = JSON.parse(JSON.stringify(arr));
	while (acc.length < n) acc.push(...a.splice(Math.floor(Math.random() * a.length), 1));
	return acc;
}

export function popFromArray<T>(arr: T[], n = 1): T[] {
	const acc: T[] = [];
	if (!arr?.length || n <= 0)
		return acc;
	let i = 0;
	while (i++ < n) {
		const v = arr.pop();

		if (v == null)
			break;
		acc.push(v);
	}
	return acc;
}

export function sampleArray<T = number, N extends number = number>(item: null | ((index?: number) => T) | T, n: N) {
	if (item === null) {
		return Array
			.from({ length: n })
			.fill(null)
			.map((_, ix) => ix + 1) as TLengthArray<T, N>;
	}
	if (item instanceof Function) {
		return Array
			.from({ length: n })
			.fill(null)
			.map((_, ix) => item(ix)) as TLengthArray<T, N>;
	}
	return Array.from({ length: n }).fill(item) as TLengthArray<T, N>;
}

/**
 * Generate a random alphanumeric ID of a given length.
 * @param {number} length
 * @return {string}
 */
export function uniqId(length = 10) {
	const keys = [...microtime().toString(36)].reverse().slice(0, Math.floor(length / 2));
	while (keys.length < length) keys.push(...sampleRange(0, 35).toString(36));
	return keys
		.slice(0, length)
		.join('')
		.toUpperCase();
}
