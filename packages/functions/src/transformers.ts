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

// ==============================
// Arithmetic transformers
// ==============================

/**
 * Adds a list of numbers together.
 *
 * @category Arithmetics
 * @param nums - An array of numbers.
 * @returns The sum of the numbers.
 */
export const add = variadic<number, number | null>((nums) => {
	if (!nums.length) return null;
	return every(nums, isNumber) ? _sum(nums) : invalid(3, 1);
});

/**
 * Subtracts the second number from the first number.
 * @category Arithmetics
 */
export function diff(a: number, b: number) {
	return some([a, b], isNil) ? null : isNumber(a) && isNumber(b) ? b - a : invalid(2);
}

/**
 * Multiplies a list of numbers.
 *
 * @category Arithmetics
 * @param nums - An array of numbers to multiply.
 * @returns The product of the numbers.
 */
export const mult = variadic<number, number | null>((nums) => {
	if (!nums.length) return null;
	return every(nums, isNumber) ? nums.reduce(multiply, 1) : invalid(3, 1);
});

/**
 * Divides the first number by the second number.
 * @category Arithmetics
 */
export function div(a: number, b: number) {
	return some([a, b], isNil)
		? null
		: isNumber(a) && isNumber(b)
			? b === 0
				? invalid(0)
				: a / b
			: invalid(2);
}

/**
 * Raises the first number to the power of the second number.
 *
 * @category Arithmetics
 * @param num1 - The base number.
 * @param num2 - The exponent.
 * @returns The result of raising the base to the exponent.
 */
export function pow(n: number, exp: number) {
	return some([n, exp], isNil) ? null : isNumber(n) && isNumber(exp) ? n ** exp : invalid(2);
}
/**
 * Increments a number by 1.
 * @category Arithmetics
 */
export function inc(n: number) {
	return isNil(n) ? null : isNumber(n) ? n + 1 : invalid(1);
}
/**
 * Decrements a number by 1.
 * @category Arithmetics
 */
export function dec(n: number) {
	return isNil(n) ? null : isNumber(n) ? n - 1 : invalid(1);
}
/**
 * Negates a number.
 * @category Arithmetics
 */
export function neg(n: number) {
	return isNil(n) ? null : isNumber(n) ? -n : invalid(1);
}
/**
 * Inverts a number.
 * @category Arithmetics
 */
export function inv(n: number) {
	return isNil(n) ? null : isNumber(n) ? 1 / n : invalid(1);
}
/**
 * Calculates the modulus of two numbers.
 *
 * @category Arithmetics
 * @returns The remainder of the modulus division of the two numbers.
 */
export function mod(a: number, b: number) {
	return some([a, b], isNil) ? null : isNumber(a) && isNumber(b) ? a % b : invalid(2);
}
/**
 * Truncates a number to its integer part.
 *
 * @category Arithmetics
 * @param num - The number to truncate.
 * @returns The integer part of the number.
 */
export function trunc(n: number) {
	return isNil(n) ? null : isNumber(n) ? Math.trunc(n) : invalid(1);
}
/**
 * Rounds a number up to the nearest integer.
 *
 * @category Arithmetics
 * @param num - The number to round up.
 * @returns The smallest integer greater than or equal to the number.
 */
export function ceil(n: number) {
	return isNil(n) ? null : isNumber(n) ? Math.ceil(n) : invalid(1);
}
/**
 * Rounds a number to the nearest integer.
 *
 * @category Arithmetics
 * @param num - The number to round.
 * @returns The nearest integer to the number.
 */
export function round(n: number) {
	return isNil(n) ? null : isNumber(n) ? Math.round(n) : invalid(1);
}

// ==============================
// Special math transformers
// ==============================

/**
 * Calculates the sine of a number.
 * @category Special Maths
 */
export function sin(n: number) {
	return isNil(n) ? null : isNumber(n) ? Math.sin(n) : invalid(1);
}
/**
 * Calculates the cosine of a number.
 * @category Special Maths
 */
export function cos(n: number) {
	return isNil(n) ? null : isNumber(n) ? Math.cos(n) : invalid(1);
}
/**
 * Calculates the square root of a number.
 * @category Special Maths
 */
export function sqrt(n: number) {
	return isNil(n) ? null : isNumber(n) ? Math.sqrt(n) : invalid(1);
}
/**
 * Calculates the logarithm of a number with a specified base.
 *
 * @category Special Maths
 * @param num - The number to calculate the logarithm of.
 * @param base - The base of the logarithm.
 * @returns The logarithm of the number with the specified base.
 */
export function log(a: number, b: number) {
	return some([a, b], isNil) ? null : isNumber(a) && isNumber(b) ? Math.log(a) / Math.log(b) : invalid(2);
}
/**
 * Calculates the natural logarithm (base e) of a number.
 * @category Special Maths
 */
export function ln(n: number) {
	return isNil(n) ? null : isNumber(n) ? Math.log(n) : invalid(1);
}
/**
 * Calculates the base-10 logarithm of a number.
 * @category Special Maths
 */
export function lg(n: number) {
	return isNil(n) ? null : isNumber(n) ? Math.log10(n) : invalid(1);
}
/**
 * Converts a number from radians to degrees.
 * @category Special Maths
 */
export function deg(rads: number) {
	return isNil(rads) ? null : isNumber(rads) ? rads * (180 / Math.PI) : invalid(1);
}
/**
 * Converts a number from degrees to radians.
 * @category Special Maths
 */
export function rad(degs: number) {
	return isNil(degs) ? null : isNumber(degs) ? degs * (Math.PI / 180) : invalid(1);
}

// ==============================
// Statistics
// ==============================

/**
 * Returns the maximum value from a list of numbers.
 *
 * @category Statistics
 * @param nums - An array of numbers to evaluate.
 * @returns The maximum value found in the array.
 */
export const max = variadic<number, number | null>((nums) => {
	if (!nums.length) return null;
	return every(nums, isNumber) ? Math.max(...nums) : invalid(3, 1);
});
/**
 * Returns the minimum value from a list of numbers.
 *
 * @category Statistics
 * @param nums - An array of numbers to evaluate.
 * @returns The minimum value found in the array.
 */
export const min = variadic<number, number | null>((nums) => {
	if (!nums.length) return null;
	return every(nums, isNumber) ? Math.min(...nums) : invalid(3, 1);
});
/**
 * Returns the average value from a list of numbers.
 *
 * @category Statistics
 * @param nums - An array of numbers to evaluate.
 * @returns The average of all values of the array.
 */
export const avg = variadic<number, number | null>((nums) => {
	if (!nums.length) return null;
	return every(nums, isNumber) ? mean(nums) : invalid(3, 1);
});
/**
 * Returns the median value from a list of numbers.
 *
 * @category Statistics
 * @param nums - An array of numbers to evaluate.
 * @returns The median value of the array.
 */
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
/**
 * Returns the sum of a list of numbers.
 *
 * @category Statistics
 * @param nums - An array of numbers to evaluate.
 * @returns The sum of the numbers in the array.
 */
export const sum = variadic<number, number | null>((nums) => {
	if (!nums.length) return null;
	return every(nums, isNumber) ? _sum(nums) : invalid(3, 1);
});
/**
 * Returns the sum of the squares of a list of numbers.
 *
 * @category Statistics
 * @param nums - An array of numbers to evaluate.
 * @returns The sum of the squares of the numbers in the array.
 */
export const sumsq = variadic<number, number | null>((nums) => {
	if (!nums.length) return null;
	return every(nums, isNumber) ? sumBy(nums, n => n ** 2) : invalid(3, 1);
});
/**
 * Returns the sum of the products of corresponding numbers in multiple lists.
 *
 * @category Statistics
 * @param nums_lists - Multiple arrays of numbers to evaluate.
 * @returns The sum of the products of corresponding numbers.
 */
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

// ==============================
// List & string transformers
// ==============================

/**
 * Returns the length of a string.
 *
 * @category List/String Transformers
 * @param str - The string to evaluate.
 * @returns The length of the string.
 */
export function len(str: string): number;

/**
 * Returns the length of an array.
 *
 * @category List/String Transformers
 * @param list - The array to evaluate.
 * @returns The length of the array.
 */
export function len<T>(list: T[]): number;

export function len<T>(input: string | T[]): number {
	return isArray(input) || isString(input) ? input.length : invalid('First argument must be a list or string.');
}

/**
 * Returns the leftmost characters of a string up to a specified length.
 *
 * @category List/String Transformers
 * @param str - The string to evaluate.
 * @param length - The number of characters to return.
 * @returns A substring containing the leftmost characters up to the specified length.
 */
export function left(str: string, length: number): string;

/**
 * Returns the leftmost elements of an array up to a specified length.
 *
 * @category List/String Transformers
 * @param list - The array to evaluate.
 * @param length - The number of elements to return.
 * @returns A subarray containing the leftmost elements up to the specified length.
 */
export function left<T>(list: T[], length: number): T[];

export function left<T>(input: string | T[], length: number): string | T[] {
	if (isString(input)) return input.substring(0, length);
	if (isArray(input)) return input.slice(0, length);
	return input;
}

/**
 * Returns the rightmost characters of a string up to a specified length.
 *
 * @category List/String Transformers
 * @param str - The string to evaluate.
 * @param length - The number of characters to return.
 * @returns A substring containing the rightmost characters up to the specified length.
 */
export function right(str: string, length: number): string;

/**
 * Returns the rightmost elements of an array up to a specified length.
 *
 * @category List/String Transformers
 * @param list - The array to evaluate.
 * @param length - The number of elements to return.
 * @returns A subarray containing the rightmost elements up to the specified length.
 */
export function right<T>(list: T[], length: number): T[];

export function right<T>(input: string | T[], length: number): string | T[] {
	if (isString(input)) return input.substring(Math.max(0, input.length - length));
	if (isArray(input)) return length ? input.slice(-length) : [];
	return input;
}

/**
 * Returns the index of a value in a string.
 *
 * @category List/String Transformers
 * @param str - The string to search.
 * @param search - The value to look for.
 * @returns The index of the value in the string, or -1 if not found.
 */
export function indexOf(str: string, search: string): number;

/**
 * Returns the index of a value in an array.
 *
 * @category List/String Transformers
 * @param list - The array to search.
 * @param value - The value to look for.
 * @returns The index of the value in the array, or -1 if not found.
 */
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

/**
 * Shuffles the characters of a string.
 *
 * @category List/String Transformers
 * @param str - The string to shuffle.
 * @returns A new string with the characters shuffled.
 */
export function shuffle(str: string): string;
/**
 * Shuffles the elements of an array.
 *
 * @category List/String Transformers
 * @param list - The array to shuffle.
 * @returns A new array with the elements shuffled.
 */
export function shuffle<T>(list: T[]): T[];
export function shuffle<T>(input: string | T[]): string | T[] {
	const toShuffledArray = <T>(arrayLike: ArrayLike<T>) => Array.from(arrayLike).sort(() => Math.random() - 0.5);

	if (isString(input)) return toShuffledArray(input).join('');
	if (isArray(input)) return toShuffledArray(input);

	return input;
}

// List transformers
/**
 * Looks up a value in a list and returns it if found.
 *
 * @category List Transformers
 * @param list - The list to search.
 * @param value - The value to look for.
 * @returns The value if found, otherwise null.
 */
export function lookup<T>(list: T[], value: T): T | null {
	if (!isArray(list)) return null;
	return find(list, it => isEqual(it, value)) || null;
}

/**
 * Repeats a value a specified number of times and returns an array of the repeated values.
 *
 * @category List Transformers
 * @param quantity - The number of times to repeat the value.
 * @param valueSample - The value to repeat.
 * @returns An array containing the repeated values.
 */
export function repeat<T>(quantity: number, valueSample: T): T[] {
	if (!isNumber(quantity)) return [];
	return Array.from<T>({ length: quantity < 0 ? 0 : quantity }).fill(valueSample);
}

// String transformers
/**
 * Returns a substring of a string.
 *
 * @category String Transformers
 * @param str - The string to extract the substring from.
 * @param start - The starting index of the substring.
 * @param end - The ending index of the substring (optional).
 * @returns The extracted substring.
 */
export function substr(str: string, start: number, end?: number): string {
	if (!isString(str) || !isNumber(start) || (!isNil(end) && !isNumber(end))) return '';
	return str.substring(start, end);
}

// Collection transformers
/**
 * Filters a collection of objects by a specified property and value.
 *
 * @category Collection Transformers
 * @param collection - The collection of objects to filter.
 * @param prop - The property name to filter by.
 * @param value - The value to filter by.
 * @returns A collection of objects that match the specified property and value.
 */
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
