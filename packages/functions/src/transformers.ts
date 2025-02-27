import {
	indexOf as _indexOf,
	sum as _sum,
	every,
	filter,
	find,
	flatMap,
	isArray,
	isEqual,
	isNil,
	isNull,
	isNumber,
	isObject,
	isString,
	mean,
	multiply,
	some,
	sumBy,
	zipWith,
} from 'lodash-es';

import { variadic } from './utils';

function invalid(type: 0): never;
function invalid(type: 1): never;
function invalid(type: 2): never;
function invalid(type: 3, presence: 0 | 1): never;
function invalid(message: string): never;
function invalid(messageOrType: 0 | 1 | 2 | 3 | string, presence?: 0 | 1): never {
	const message = isString(messageOrType)
		? messageOrType
		: {
				0: 'Division by 0 is not acceptable',
				1: 'Argument must be provided and be a valid number.',
				2: 'Both arguments must be provided and be valid numbers.',
				3: {
					0: 'At least 1 parameter must be provided and be a number.',
					1: 'All arguments must be numbers.',
				}[presence ?? 0],
			}[messageOrType] ?? 'An unexpected error has occurred.';

	throw new TypeError(message);
}

// Arithmetic transformers
export const add = variadic<number, number | null>((nums) => {
	if (!nums.length) return null;
	return every(nums, isNumber) ? _sum(nums) : invalid(3, 1);
});

export function diff(a: number, b: number) {
	return some([a, b], isNil) ? null : isNumber(a) && isNumber(b) ? b - a : invalid(2);
}

export const mult = variadic<number, number | null>((nums) => {
	if (!nums.length) return null;
	return every(nums, isNumber) ? nums.reduce(multiply, 1) : invalid(3, 1);
});

export function div(a: number, b: number) {
	return some([a, b], isNil)
		? null
		: isNumber(a) && isNumber(b)
			? b === 0
				? invalid(0)
				: a / b
			: invalid(2);
}

export function pow(n: number, exp: number) {
	return some([n, exp], isNil) ? null : isNumber(n) && isNumber(exp) ? n ** exp : invalid(2);
}
export function inc(n: number) {
	return isNil(n) ? null : isNumber(n) ? n + 1 : invalid(1);
}

export function dec(n: number) {
	return isNil(n) ? null : isNumber(n) ? n - 1 : invalid(1);
}

export function neg(n: number) {
	return isNil(n) ? null : isNumber(n) ? -n : invalid(1);
}

export function inv(n: number) {
	return isNil(n) ? null : isNumber(n) ? 1 / n : invalid(1);
}

export function mod(a: number, b: number) {
	return some([a, b], isNil) ? null : isNumber(a) && isNumber(b) ? a % b : invalid(2);
}

export function trunc(n: number) {
	return isNil(n) ? null : isNumber(n) ? Math.trunc(n) : invalid(1);
}

export function ceil(n: number) {
	return isNil(n) ? null : isNumber(n) ? Math.ceil(n) : invalid(1);
}

export function round(n: number) {
	return isNil(n) ? null : isNumber(n) ? Math.round(n) : invalid(1);
}

// Special math transformers
export function sin(n: number) {
	return isNil(n) ? null : isNumber(n) ? Math.sin(n) : invalid(1);
}

export function cos(n: number) {
	return isNil(n) ? null : isNumber(n) ? Math.cos(n) : invalid(1);
}

export function sqrt(n: number) {
	return isNil(n) ? null : isNumber(n) ? Math.sqrt(n) : invalid(1);
}

export function log(a: number, b: number) {
	return some([a, b], isNil) ? null : isNumber(a) && isNumber(b) ? Math.log(a) / Math.log(b) : invalid(2);
}

export function ln(n: number) {
	return isNil(n) ? null : isNumber(n) ? Math.log(n) : invalid(1);
}

export function lg(n: number) {
	return isNil(n) ? null : isNumber(n) ? Math.log10(n) : invalid(1);
}

export function deg(rads: number) {
	return isNil(rads) ? null : isNumber(rads) ? rads * (180 / Math.PI) : invalid(1);
}

export function rad(degs: number) {
	return isNil(degs) ? null : isNumber(degs) ? degs * (Math.PI / 180) : invalid(1);
}

// Statistics transformers
export const max = variadic<number, number | null>((nums) => {
	if (!nums.length) return null;
	return every(nums, isNumber) ? Math.max(...nums) : invalid(3, 1);
});

export const min = variadic<number, number | null>((nums) => {
	if (!nums.length) return null;
	return every(nums, isNumber) ? Math.min(...nums) : invalid(3, 1);
});

export const avg = variadic<number, number | null>((nums) => {
	if (!nums.length) return null;
	return every(nums, isNumber) ? mean(nums) : invalid(3, 1);
});

export const med = variadic<number, number | null>((nums) => {
	if (!nums.length) return null;
	return every(nums, isNumber)
		? (() => {
				const sorted = ([] as number[]).concat(nums).sort((a, b) => a - b);
				const middle = Math.floor(sorted.length / 2);

				return sorted.length % 2
					? sorted[middle]!
					: (sorted[middle - 1]! + sorted[middle]!) / 2;
			})()
		: invalid(3, 1);
});

export const sum = variadic<number, number | null>((nums) => {
	if (!nums.length) return null;
	return every(nums, isNumber) ? _sum(nums) : invalid(3, 1);
});

export const sumsq = variadic<number, number | null>((nums) => {
	if (!nums.length) return null;
	return every(nums, isNumber) ? sumBy(nums, n => n ** 2) : invalid(3, 1);
});

export const sumProduct = variadic<number[], number>((lists) => {
	if (!every(lists, isArray)) return invalid('All arguments provided must be lists');
	if (lists.length < 2) return invalid('At least 2 lists of the same length must be provided.');

	const len = lists[0]!.length;
	if (len === 0) return invalid('All lists must have at least 1 number.');
	if (!every(lists, sub => len === sub.length)) return invalid('All lists provided must be the same length.');
	if (!every(flatMap(lists), isNumber)) return invalid('All items in the provided lists must be numbers.');

	const products = zipWith(...lists, (...values) => values.reduce((prod, num) => prod * num, 1));
	return _sum(products);
});

// List and string transformers
export function len(str: string): number;
export function len<T>(list: T[]): number;
export function len<T>(input: string | T[]): number {
	return isArray(input) || isString(input) ? input.length : 0;
}

export function left(str: string, length: number): string;
export function left<T>(list: T[], length: number): T[];
export function left<T>(input: string | T[], length: number): string | T[] {
	if (isString(input)) return input.substring(0, length);
	if (isArray(input)) return input.slice(0, length);
	return input;
}

export function right(str: string, length: number): string;
export function right<T>(list: T[], length: number): T[];
export function right<T>(input: string | T[], length: number): string | T[] {
	if (isString(input)) return input.substring(Math.max(0, input.length - length));
	if (isArray(input)) return length ? input.slice(-length) : [];
	return input;
}

export function indexOf(str: string, search: string): number;
export function indexOf<T>(list: T[], value: T): number;
export function indexOf<T>(input: string | T[], value: string | T): number {
	if (isString(input)) return _indexOf(input, value);

	if (isArray(input)) {
		for (let i = 0; i < input.length; i++) {
			if (isEqual(input[i], value)) return i;
		}
	}

	return -1;
}

export function shuffle(str: string): string;
export function shuffle<T>(list: T[]): T[];
export function shuffle<T>(input: string | T[]): string | T[] {
	const toShuffledArray = <T>(arrayLike: ArrayLike<T>) => Array.from(arrayLike).sort(() => Math.random() - 0.5);

	if (isString(input)) return toShuffledArray(input).join('');
	if (isArray(input)) return toShuffledArray(input);

	return input;
}

// List transformers
export function lookup<T>(list: T[], value: T) {
	if (!isArray(list)) return null;
	return find(list, it => isEqual(it, value));
}

export function repeat<T>(quantity: number, valueSample: T): T[] {
	if (!isNumber(quantity)) return [];
	return Array.from<T>({ length: quantity < 0 ? 0 : quantity }).fill(valueSample);
}

// String transformers
export function substr(str: string, start: number, end?: number): string {
	if (!isString(str) || !isNumber(start) || (!isNil(end) && !isNumber(end))) return '';
	return str.substring(start, end);
}

// Collection transformers
export function filterBy<T extends Record<string, any>>(collection: T[], prop: string, value: any): T[] {
	if (!isArray(collection)) return [];
	return filter(collection, item => isObject(item) && !isNull(item) && isEqual(item[prop], value));
}

export {
	concat,
	every,
	find,
	intersection as intersect,
	keys,
	merge,
	omit,
	padStart as padLeft,
	padEnd as padRight,
	pick,
	sample,
	set as setAttr,
	unset as unsetAttr,
	values,
	zip,
} from 'lodash-es';
