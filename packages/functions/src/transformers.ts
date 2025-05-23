import * as _ from 'lodash-es';
import { TCollection, TNullable } from './types/common';
import { isCollection, isIterable } from './types/guards';
import { invalid } from './utils/errors';
import { variadic } from './utils/utils';

// ┌───────────────────────────────────────────────────────────────────────────┐
// │                         Arithmetic Transformers                           │
// └───────────────────────────────────────────────────────────────────────────┘

/**
 * Adds a list of numbers together.
 *
 * @category Arithmetics
 * @param nums - An array of numbers.
 * @returns The sum of the numbers.
 */
export const add = variadic<number, number | null>((nums) => {
	return nums.length
		? _.reduce(nums, (a, n) => _.isNumber(n) ? a + n : invalid('ALL_ARGUMENTS_MUST_BE_NUMBERS'), 0)
		: null;
});

/**
 * Subtracts the second number from the first number.
 *
 * @category Arithmetics
 * @param a - The first number.
 * @param b - The second number to subtract from the first.
 * @returns The difference between the numbers, or null if any argument is nil.
 */
export function diff(a: number, b: number) {
	return _.some([a, b], _.isNil)
		? null
		: _.isNumber(a) && _.isNumber(b) ? b - a : invalid('INVALID_NUMBER_ARGUMENTS');
}

/**
 * Multiplies a list of numbers.
 *
 * @category Arithmetics
 * @param nums - An array of numbers to multiply.
 * @returns The product of the numbers.
 */
export const mult = variadic<number, number | null>((nums) => {
	return nums.length
		? _.reduce(nums, (a, n) => _.isNumber(n) ? n * a : invalid('ALL_ARGUMENTS_MUST_BE_NUMBERS'), 1)
		: null;
});

/**
 * Divides the first number by the second number.
 *
 * @category Arithmetics
 * @param a - The dividend.
 * @param b - The divisor.
 * @returns The quotient of the division, or null if any argument is nil.
 */
export function div(a: number, b: number) {
	return _.some([a, b], _.isNil)
		? null
		: _.isNumber(a) && _.isNumber(b)
			? b === 0
				? invalid('DIVISION_BY_ZERO')
				: a / b
			: invalid('INVALID_NUMBER_ARGUMENTS');
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
	return _.some([n, exp], _.isNil)
		? null
		: _.isNumber(n) && _.isNumber(exp)
			? n ** exp
			: invalid('INVALID_NUMBER_ARGUMENTS');
}

/**
 * Increments a number by 1.
 *
 * @category Arithmetics
 * @param n - The number to increment.
 * @returns The number incremented by 1, or null if the argument is nil.
 */
export function inc(n: number) {
	return _.isNil(n) ? null : _.isNumber(n) ? n + 1 : invalid('INVALID_NUMBER_ARGUMENT');
}

/**
 * Decrements a number by 1.
 *
 * @category Arithmetics
 * @param n - The number to decrement.
 * @returns The number decremented by 1, or null if the argument is nil.
 */
export function dec(n: number) {
	return _.isNil(n) ? null : _.isNumber(n) ? n - 1 : invalid('INVALID_NUMBER_ARGUMENT');
}

/**
 * Negates a number.
 *
 * @category Arithmetics
 * @param n - The number to negate.
 * @returns The negated number, or null if the argument is nil.
 */
export function neg(n: number) {
	return _.isNil(n) ? null : _.isNumber(n) ? -n : invalid('INVALID_NUMBER_ARGUMENT');
}

/**
 * Inverts a number.
 *
 * @category Arithmetics
 * @param n - The number to invert.
 * @returns The reciprocal of the number (1/n), or null if the argument is nil.
 */
export function inv(n: number) {
	return _.isNil(n) ? null : _.isNumber(n) ? 1 / n : invalid('INVALID_NUMBER_ARGUMENT');
}

/**
 * Calculates the modulus of two numbers.
 *
 * @category Arithmetics
 * @param a - The dividend.
 * @param b - The divisor.
 * @returns The remainder of the modulus division of the two numbers.
 */
export function mod(a: number, b: number) {
	return _.some([a, b], _.isNil)
		? null
		: _.isNumber(a) && _.isNumber(b)
			? a % b
			: invalid('INVALID_NUMBER_ARGUMENTS');
}
/**
 * Truncates a number to its integer part.
 *
 * @category Arithmetics
 * @param num - The number to truncate.
 * @returns The integer part of the number.
 */
export function trunc(n: number) {
	return _.isNil(n) ? null : _.isNumber(n) ? Math.trunc(n) : invalid('INVALID_NUMBER_ARGUMENT');
}
/**
 * Rounds a number up to the nearest integer.
 *
 * @category Arithmetics
 * @param num - The number to round up.
 * @returns The smallest integer greater than or equal to the number.
 */
export function ceil(n: number) {
	return _.isNil(n) ? null : _.isNumber(n) ? Math.ceil(n) : invalid('INVALID_NUMBER_ARGUMENT');
}

/**
 * Rounds a number to the nearest integer or to specified precision.
 *
 * @category Arithmetics
 * @param num - The number to round.
 * @param precision - The number of decimal places to round to (default: 0).
 * @returns The rounded number.
 */
export function round(n: number, precision: number = 0) {
	if (_.isNil(n)) return null;
	if (!_.isNumber(n)) return invalid('INVALID_NUMBER_ARGUMENT');
	if (!_.isNumber(precision) || precision < 0 || !_.isInteger(precision))
		return invalid('INVALID_PRECISION_ARGUMENT');

	const factor = 10 ** precision;
	return Math.round(n * factor) / factor;
}

// ┌───────────────────────────────────────────────────────────────────────────┐
// │                        Special Math Transformers                          │
// └───────────────────────────────────────────────────────────────────────────┘

/**
 * Calculates the sine of a number.
 *
 * @category Special Maths
 * @param n - The number to calculate the sine of (in radians).
 * @returns The sine of the number, or null if the argument is nil.
 */
export function sin(n: number) {
	return _.isNil(n) ? null : _.isNumber(n) ? Math.sin(n) : invalid('INVALID_NUMBER_ARGUMENT');
}
/**
 * Calculates the cosine of a number.
 *
 * @category Special Maths
 * @param n - The number to calculate the cosine of (in radians).
 * @returns The cosine of the number, or null if the argument is nil.
 */
export function cos(n: number) {
	return _.isNil(n) ? null : _.isNumber(n) ? Math.cos(n) : invalid('INVALID_NUMBER_ARGUMENT');
}
/**
 * Calculates the square root of a number.
 *
 * @category Special Maths
 * @param n - The number to calculate the square root of.
 * @returns The square root of the number, or null if the argument is nil.
 */
export function sqrt(n: number) {
	return _.isNil(n) ? null : _.isNumber(n) ? Math.sqrt(n) : invalid('INVALID_NUMBER_ARGUMENT');
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
	return _.some([a, b], _.isNil)
		? null
		: _.isNumber(a) && _.isNumber(b)
			? Math.log(a) / Math.log(b)
			: invalid('INVALID_NUMBER_ARGUMENTS');
}
/**
 * Calculates the natural logarithm (base e) of a number.
 *
 * @category Special Maths
 * @param n - The number to calculate the natural logarithm of.
 * @returns The natural logarithm of the number, or null if the argument is nil.
 */
export function ln(n: number) {
	return _.isNil(n) ? null : _.isNumber(n) ? Math.log(n) : invalid('INVALID_NUMBER_ARGUMENT');
}
/**
 * Calculates the base-10 logarithm of a number.
 *
 * @category Special Maths
 * @param n - The number to calculate the base-10 logarithm of.
 * @returns The base-10 logarithm of the number, or null if the argument is nil.
 */
export function lg(n: number) {
	return _.isNil(n) ? null : _.isNumber(n) ? Math.log10(n) : invalid('INVALID_NUMBER_ARGUMENT');
}
/**
 * Converts a number from radians to degrees.
 *
 * @category Special Maths
 * @param rads - The angle in radians to convert to degrees.
 * @returns The angle in degrees, or null if the argument is nil.
 */
export function deg(rads: number) {
	return _.isNil(rads) ? null : _.isNumber(rads) ? rads * (180 / Math.PI) : invalid('INVALID_NUMBER_ARGUMENT');
}
/**
 * Converts a number from degrees to radians.
 *
 * @category Special Maths
 * @param degs - The angle in degrees to convert to radians.
 * @returns The angle in radians, or null if the argument is nil.
 */
export function rad(degs: number) {
	return _.isNil(degs) ? null : _.isNumber(degs) ? degs * (Math.PI / 180) : invalid('INVALID_NUMBER_ARGUMENT');
}

// ┌───────────────────────────────────────────────────────────────────────────┐
// │                                Statistics                                 │
// └───────────────────────────────────────────────────────────────────────────┘

/**
 * Returns the maximum value from a list of numbers.
 *
 * @category Statistics
 * @param nums - An array of numbers to evaluate.
 * @returns The maximum value found in the array.
 */
export const max = variadic<number, number | null>((nums) => {
	return nums.length ? _.maxBy(nums, n => _.isNumber(n) ? n : invalid('INVALID_NUMBER_ARGUMENT'))! : null;
});
/**
 * Returns the minimum value from a list of numbers.
 *
 * @category Statistics
 * @param nums - An array of numbers to evaluate.
 * @returns The minimum value found in the array.
 */
export const min = variadic<number, number | null>((nums) => {
	return nums.length ? _.minBy(nums, n => _.isNumber(n) ? n : invalid('INVALID_NUMBER_ARGUMENT'))! : null;
});
/**
 * Returns the average value from a list of numbers.
 *
 * @category Statistics
 * @param nums - An array of numbers to evaluate.
 * @returns The average of all values of the array.
 */
export const avg = variadic<number, number | null>((nums) => {
	return nums.length ? _.meanBy(nums, n => _.isNumber(n) ? n : invalid('INVALID_NUMBER_ARGUMENT')) : null;
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
	if (!_.every(nums, _.isNumber)) return invalid('INVALID_NUMBER_ARGUMENT');

	const sorted = _.sortBy(nums);
	const middle = Math.floor(sorted.length / 2);

	return sorted.length % 2
		? sorted[middle]!
		: (sorted[middle - 1]! + sorted[middle]!) / 2;
});

/**
 * Returns the sum of a list of numbers.
 *
 * @category Statistics
 * @param nums - An array of numbers to evaluate.
 * @returns The sum of the numbers in the array.
 */
export const sum = variadic<number, number | null>((nums) => {
	return nums.length ? _.sumBy(nums, n => _.isNumber(n) ? n : invalid('INVALID_NUMBER_ARGUMENT')) : null;
});

/**
 * Returns the sum of the squares of a list of numbers.
 *
 * @category Statistics
 * @param nums - An array of numbers to evaluate.
 * @returns The sum of the squares of the numbers in the array.
 */
export const sumsq = variadic<number, number | null>((nums) => {
	return nums.length ? _.sumBy(nums, n => _.isNumber(n) ? n ** 2 : invalid('INVALID_NUMBER_ARGUMENT')) : null;
});

/**
 * Returns the sum of the products of corresponding numbers in multiple lists.
 *
 * @category Statistics
 * @param nums_lists - Multiple arrays of numbers to evaluate.
 * @returns The sum of the products of corresponding numbers.
 */
export const sumProduct = variadic<number[], number>((lists) => {
	if (!lists.every(_.isArray)) return invalid('LISTS_MUST_BE_ARRAYS');
	if (lists.length < 2) return invalid('MIN_TWO_LISTS_REQUIRED');

	lists.every((list, idx) => {
		if (!list.length) return invalid('NON_EMPTY_LISTS_REQUIRED');
		if (idx > 0 && list.length !== lists[0]!.length) return invalid('LISTS_MUST_BE_SAME_LENGTH');
		if (!_.every(list, _.isNumber)) return invalid('ALL_LIST_ITEMS_MUST_BE_NUMBERS');
		return true;
	});

	return _.sum(_.zipWith(...lists, (...values) => values.reduce((prod, num) => prod * num, 1)));
});

// ┌───────────────────────────────────────────────────────────────────────────┐
// │                        List & String Transformers                         │
// └───────────────────────────────────────────────────────────────────────────┘

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
 * @template T - The type of the elements in the array.
 * @param list - The array to evaluate.
 * @returns The length of the array.
 */
export function len<T>(list: T[]): number;
export function len<T>(iterable: string | T[]): number {
	return isIterable(iterable) ? iterable.length : 0;
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
 * @template T - The type of the elements in the array.
 * @param list - The array to evaluate.
 * @param length - The number of elements to return.
 * @returns A new array containing the leftmost elements up to the specified length.
 */
export function left<T>(list: T[], length: number): T[];
export function left<T>(iterable: string | T[], length = 0): string | T[] {
	return isIterable(iterable) && _.isLength(length)
		? _.isString(iterable)
			? iterable.substring(0, length)
			: iterable.slice(0, length)
		: iterable;
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
 * @template T - The type of the elements in the array.
 * @param list - The array to evaluate.
 * @param length - The number of elements to return.
 * @returns A new array containing the rightmost elements up to the specified length.
 */
export function right<T>(list: T[], length: number): T[];
export function right<T>(iterable: string | T[], length = 0): string | T[] {
	return isIterable(iterable) && _.isLength(length)
		? _.isString(iterable)
			? iterable.substring(Math.max(0, iterable.length - length))
			: iterable.slice(-length)
		: iterable;
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
 * @template T - The type of the elements in the array.
 * @param list - The array to search.
 * @param value - The value to look for.
 * @returns The index of the value in the array, or -1 if not found.
 */
export function indexOf<T>(list: T[], value: T): number;
export function indexOf<T>(iterable: string | T[], value: string | T): number {
	return isIterable(iterable)
		? _.isString(iterable) && _.isString(value)
			? iterable.indexOf(value)
			: _.findIndex(iterable as ArrayLike<T>, it => _.isEqual(it, value))
		: -1;
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
 * @template T - The type of the elements in the array.
 * @param list - The array to shuffle.
 * @returns A new array with the elements shuffled.
 */
export function shuffle<T>(list: T[]): T[];
export function shuffle<T>(iterable: string | T[]): string | T[] {
	return isIterable(iterable)
		? _.isString(iterable)
			? _.shuffle(iterable).join('')
			: _.shuffle(iterable)
		: iterable;
}

/**
 * Reverses the characters of a string or elements of an array.
 *
 * @category List/String Transformers
 * @param str - The string to reverse.
 * @returns A new string with the characters in reverse order.
 */
export function reverse(str: string): string;

/**
 * Reverses the elements of an array.
 *
 * @category List/String Transformers
 * @template T - The type of the elements in the array.
 * @param list - The array to reverse.
 * @returns A new array with the elements in reverse order.
 */
export function reverse<T>(list: T[]): T[];
export function reverse<T>(iterable: string | T[]): string | T[] {
	return isIterable(iterable)
		? _.isString(iterable)
			? iterable.split('').reverse().join('')
			: iterable.slice().reverse()
		: iterable;
}

// ┌───────────────────────────────────────────────────────────────────────────┐
// │                      List & Collection Transformers                       │
// └───────────────────────────────────────────────────────────────────────────┘

/**
 * Sorts the characters of a string in ascending order.
 *
 * @category List/String Transformers
 * @param str - The string to sort.
 * @returns A new string with the characters sorted.
 */
export function sort(str: string): string;

/**
 * Sorts the elements of an array in ascending order.
 *
 * @category List/String Transformers
 * @template T - The type of the elements in the array.
 * @param list - The array to sort.
 * @returns A new array with the elements sorted.
 */
export function sort<T>(list: T[]): T[];

/**
 * Sorts the elements of a collection by a specified property.
 *
 * @category Collection Transformers
 * @param collection - The collection to sort.
 * @param keyName - The property name to sort by (default: 'id').
 * @param defaultValue - The default value to use if the property is absent (default: null).
 * @returns A new collection with the elements sorted by the specified property.
 */
export function sort(collection: TCollection, keyName?: string, defaultValue?: any): TCollection;
export function sort<T>(iterable: string | T[] | TCollection, keyName: string = 'id', defaultValue: any = null): string | T[] | TCollection {
	if (!isIterable(iterable)) return iterable;

	if (_.isString(iterable)) {
		return iterable
			.split('')
			.sort()
			.join('');
	}

	if (isCollection(iterable) && keyName) {
		return _.sortBy(iterable, (item) => {
			const value = item[keyName];
			return value !== undefined ? value : defaultValue;
		});
	}

	return (iterable as T[]).slice().sort();
}

// ┌───────────────────────────────────────────────────────────────────────────┐
// │                            List Transformers                              │
// └───────────────────────────────────────────────────────────────────────────┘

/**
 * Looks up a value in a list and returns it if found.
 *
 * @category List Transformers
 * @template T - The type of the elements in the array.
 * @param list - The list to search.
 * @param value - The value to look for.
 * @returns The value if found, otherwise null.
 */
export function lookup<T>(list: T[], value: T): TNullable<T> {
	if (!_.isArray(list)) return null;

	for (const item of list) {
		if (_.isEqual(item, value)) return item;
	}

	return null;
}

/**
 * Repeats a value a specified number of times and returns an array of the repeated values.
 *
 * @category List Transformers
 * @template T - The type of the elements in the array.
 * @param quantity - The number of times to repeat the value.
 * @param valueSample - The value to repeat.
 * @returns An array containing the repeated values.
 */
export function repeat<T>(quantity: number, sample: T): T[] {
	if (!_.isNumber(quantity)) return [];
	return Array.from<T>({ length: quantity < 0 ? 0 : quantity }).fill(sample);
}

// ┌───────────────────────────────────────────────────────────────────────────┐
// │                           String Transformers                             │
// └───────────────────────────────────────────────────────────────────────────┘

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
	if (!_.isString(str) || !_.isNumber(start) || (!_.isNil(end) && !_.isNumber(end))) return '';
	return str.substring(start, end);
}

// ┌───────────────────────────────────────────────────────────────────────────┐
// │                         Collection Transformers                           │
// └───────────────────────────────────────────────────────────────────────────┘

/**
 * Filters a collection of objects by a specified property and value.
 *
 * @category Collection Transformers
 * @template S - The type of the value to filter by.
 * @param collection - The collection of objects to filter.
 * @param prop - The property name to filter by.
 * @param value - The value to filter by.
 * @returns A collection of objects that match the specified property and value.
 */
export function filterBy<S>(collection: TCollection, prop: string, value: S): TCollection {
	return isCollection(collection) ? _.filter(collection, it => _.isEqual(it[prop], value)) : [];
}
/**
 * Returns a list of property values from a collection of objects.
 *
 * @category Collection Transformers
 * @param collection - The collection of objects to extract values from.
 * @param prop - The property name to extract.
 * @returns A list containing all property values from the collection items, in order of appearance.
 */
export function pluck(collection: TCollection, prop: string): any[] {
	return isCollection(collection) ? _.map(collection, item => item[prop]) : [];
}

// ┌───────────────────────────────────────────────────────────────────────────┐
// │                              Lodash Re-exports                            │
// └───────────────────────────────────────────────────────────────────────────┘

export const concat = _.concat;
export const find = _.find;
export const every = _.every;
export const intersect = _.intersection;
export const keys = _.keys;
export const merge = _.merge;
export const omit = _.omit;
export const padRight = _.padEnd;
export const padLeft = _.padStart;
export const pick = _.pick;
export const sample = _.sample;
export const setAttr = _.set;
export const unsetAttr = _.unset;
export const values = _.values;
export const zip = _.zip;
