/**
 * @module
 * @showCategories
 *
 * @categoryDescription Binary Predicates
 * Functions that compare numerical values and return either 'true' or 'false'.
 */

import { every, isEqual, isNil, isNull, some } from 'lodash-es';
import { invalid } from './utils/errors';

// ==============================
// Logical (binary) predicates
// ==============================

/**
 * Evaluates a series of conditions and returns true if all conditions are true.
 *
 * @category Binary Predicates
 * @param conditions - An array of boolean conditions to evaluate.
 * @returns True if all conditions are true, otherwise false.
 */
export const and = (...conditions: any[]): boolean => every((conditions || []), Boolean) ?? false;
/**
 * {@inheritDoc and}
 * @category Binary Predicates
 */
export const all = and;

/**
 * Evaluates a series of conditions and returns true if at least one condition is true.
 *
 * @category Binary Predicates
 * @param conditions - An array of boolean conditions to evaluate.
 * @returns True if at least one condition is true, otherwise false.
 */
export const or = (...conditions: any[]): boolean => some((conditions || []), Boolean) ?? false;
/**
 * {@inheritDoc or}
 * @category Binary Predicates
 */
export const any = or;

/**
 * Negates the provided condition.
 *
 * @category Binary Predicates
 * @param condition - The condition to negate.
 * @returns The negated condition.
 */
export const not = (condition: any): boolean => isNil(condition) ? invalid('INVALID_BINARY_ARGUMENT') : !condition;

/**
 * Evaluates a series of conditions and returns true if none of the conditions are true.
 *
 * @category Binary Predicates
 * @param conditions - An array of boolean conditions to evaluate.
 * @returns True if none of the conditions are true, otherwise false.
 */
export const none = (...conditions: any[]): boolean => every((conditions || []), t => !t) ?? false;

// ==============================
// Numeric predicates
// ==============================

/**
 * Checks if a number is even.
 *
 * @category Numeric Predicates
 * @param n - The number to check.
 * @returns True if the number is even, otherwise false. Throws if the argument is not a number.
 */
export function isEven(n: number): boolean | null {
	if (!Number.isFinite(n)) return invalid('INVALID_NUMERIC_ARGUMENT');
	return n % 2 === 0;
}

/**
 * Checks if a number is odd.
 *
 * @category Numeric Predicates
 * @param n - The number to check.
 * @returns True if the number is odd, otherwise false. Throws if the argument is not a number.
 */
export function isOdd(n: number): boolean | null {
	return !isEven(n);
}

/**
 * Checks if a value is an integer.
 *
 * @category Numeric Predicates
 * @param value - The value to check.
 * @returns True if the value is an integer, otherwise false. Throws if the argument is not a number.
 */
export function isInteger(value: number): boolean | null {
	if (!Number.isFinite(value))
		return invalid('INVALID_NUMERIC_ARGUMENT');
	return Number.isInteger(value);
}
/**
 * Checks if the first number is greater than the second number.
 *
 * @category Numeric Predicates
 * @param a - The first number to compare.
 * @param b - The second number to compare.
 * @returns True if the first number is greater, otherwise false. Throws if either argument is not a number.
 */
export function isGreater(a: number, b: number): boolean {
	return (Number.isFinite(a) && Number.isFinite(b)) ? a > b : invalid('ALL_ARGUMENTS_MUST_BE_NUMBERS');
}

/**
 * Checks if the first number is greater than or equal to the second number.
 *
 * @category Numeric Predicates
 * @param a - The first number to compare.
 * @param b - The second number to compare.
 * @returns True if the first number is greater than or equal, otherwise false. Throws if either argument is not a number.
 */
export function isGreaterOrEqual(a: number, b: number): boolean {
	return (Number.isFinite(a) && Number.isFinite(b)) ? a >= b : invalid('ALL_ARGUMENTS_MUST_BE_NUMBERS');
}

/**
 * Checks if the first number is less than the second number.
 *
 * @category Numeric Predicates
 * @param a - The first number to compare.
 * @param b - The second number to compare.
 * @returns True if the first number is less, otherwise false. Throws if either argument is not a number.
 */
export function isLess(a: number, b: number): boolean {
	return (Number.isFinite(a) && Number.isFinite(b)) ? a < b : invalid('ALL_ARGUMENTS_MUST_BE_NUMBERS');
}

/**
 * Checks if the first number is less than or equal to the second number.
 *
 * @category Numeric Predicates
 * @param a - The first number to compare.
 * @param b - The second number to compare.
 * @returns True if the first number is less than or equal, otherwise false. Throws if either argument is not a number.
 */
export function isLessOrEqual(a: number, b: number): boolean {
	return (Number.isFinite(a) && Number.isFinite(b)) ? a <= b : invalid('ALL_ARGUMENTS_MUST_BE_NUMBERS');
}

/**
 * Checks if a number is negative.
 *
 * @category Numeric Predicates
 * @param value - The number to check.
 * @returns True if the number is negative, otherwise false. Throws if the argument is not a number.
 */
export function isNegative(value: number): boolean {
	if (!Number.isFinite(value)) return invalid('INVALID_NUMERIC_ARGUMENT');
	return value < 0;
}

/**
 * Checks if a number is positive.
 *
 * @category Numeric Predicates
 * @param value - The number to check.
 * @returns True if the number is positive, otherwise false. Throws if the argument is not a number.
 */
export function isPositive(value: number): boolean {
	if (!Number.isFinite(value)) return invalid('INVALID_NUMERIC_ARGUMENT');
	return value > 0;
}

// ==============================
// Lookup predicates
// ==============================

/**
 * Checks if a string contains a specified substring.
 *
 * @category Lookup Predicates
 * @param str - The string to check.
 * @param substr - The substring to check for.
 * @returns True if the substring is found, otherwise false.
 */
export function contains(str: string, substr: string): boolean;

/**
 * Checks if an object contains a specified value.
 *
 * @template T - The type of the object.
 * @category Lookup Predicates
 * @param obj - The object to check.
 * @param value - The value to check for.
 * @returns True if the value is found, otherwise false.
 */
export function contains<T extends object>(obj: T, value: any): boolean;

/**
 * Checks if an array contains a specified value.
 *
 * @template T - The type of the elements in the array.
 * @template V - The type of the value to check for.
 * @category Lookup Predicates
 * @param list - The array to check.
 * @param value - The value to check for.
 * @returns True if the value is found, otherwise false.
 */
export function contains<T, V>(list: ArrayLike<T>, value: V): boolean;

export function contains(container: string | object | any[], value: any): boolean {
	switch (true) {
		case typeof container === 'string':
			if (typeof value === 'string') return container.includes(value);
			return invalid('INVALID_ARGUMENTS');
		case Array.isArray(container):
			return container.includes(value);
		case !container:
			return false;
		case typeof container !== 'object':
			return invalid('INVALID_ARGUMENTS');
		default:
			return Object.values(container).includes(value);
	}
}

/**
 * Checks if an array has a specified index.
 *
 * @template T - The type of the elements in the array.
 * @category Lookup Predicates
 * @param list - The array to check.
 * @param index - The index to check for.
 * @returns True if the index is found, otherwise false.
 */
export function has<T>(list: T[], index: number): boolean;

/**
 * Checks if an object has a specified key.
 *
 * @template T - The type of the object.
 * @category Lookup Predicates
 * @param obj - The object to check.
 * @param key - The key to check for.
 * @returns True if the key is found, otherwise false.
 */
export function has<T extends object>(obj: T, key: any): key is keyof T;

export function has(container: object | any[], key: any): boolean {
	if (!container) return false;
	if (isNil(key))
		return invalid('INVALID_ARGUMENTS');
	try {
		return Object.keys(container).includes(String(key));
	} catch (error) {
		return invalid('INVALID_ARGUMENTS', (error as Error).message);
	}
}

export { isEqual, isNull };
