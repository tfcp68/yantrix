/**
 * @module
 * @showCategories
 *
 * @categoryDescription Binary Predicates
 * Functions that compare numerical values and return either 'true' or 'false'.
 */

import { every, isArray, isEqual, isNull, isNumber, isObject, isString, some, values } from 'lodash-es';
import { variadic } from './utils/utils';

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
export const and = variadic((conditions: boolean[]): boolean => every(conditions, Boolean));
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
export const or = variadic((conditions: boolean[]): boolean => some(conditions, Boolean));
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
export const not = (condition: boolean): boolean => !condition;

/**
 * Evaluates a series of conditions and returns true if none of the conditions are true.
 *
 * @category Binary Predicates
 * @param conditions - An array of boolean conditions to evaluate.
 * @returns True if none of the conditions are true, otherwise false.
 */
export const none = variadic((conditions: boolean[]): boolean => not(and(conditions)));

// ==============================
// Numeric predicates
// ==============================

/**
 * Checks if a number is even.
 *
 * @category Numeric Predicates
 * @param n - The number to check.
 * @returns True if the number is even, otherwise false. Returns null if the argument is not a number.
 */
export function isEven(n: number): boolean | null {
	return isNumber(n) ? n % 2 === 0 : null;
}

/**
 * Checks if a number is odd.
 *
 * @category Numeric Predicates
 * @param n - The number to check.
 * @returns True if the number is odd, otherwise false. Returns null if the argument is not a number.
 */
export function isOdd(n: number): boolean | null {
	return isNumber(n) ? Math.abs(n % 2) === 1 : null;
}

/**
 * Checks if a value is an integer.
 *
 * @category Numeric Predicates
 * @param value - The value to check.
 * @returns True if the value is an integer, otherwise false. Returns null if the argument is not a number.
 */
export function isInteger(value: number): boolean | null {
	if (!isNumber(value)) return null;
	return Number.isInteger(value);
}
/**
 * Checks if the first number is greater than the second number.
 *
 * @category Numeric Predicates
 * @param a - The first number to compare.
 * @param b - The second number to compare.
 * @returns True if the first number is greater, otherwise false. Returns null if either argument is not a number.
 */
export function isGreater(a: number, b: number): boolean | null {
	if (!isNumber(a) || !isNumber(b)) return null;
	return a > b;
}

/**
 * Checks if the first number is greater than or equal to the second number.
 *
 * @category Numeric Predicates
 * @param a - The first number to compare.
 * @param b - The second number to compare.
 * @returns True if the first number is greater than or equal, otherwise false. Returns null if either argument is not a number.
 */
export function isGreaterOrEqual(a: number, b: number): boolean | null {
	if (!isNumber(a) || !isNumber(b)) return null;
	return a >= b;
}

/**
 * Checks if the first number is less than the second number.
 *
 * @category Numeric Predicates
 * @param a - The first number to compare.
 * @param b - The second number to compare.
 * @returns True if the first number is less, otherwise false. Returns null if either argument is not a number.
 */
export function isLess(a: number, b: number): boolean | null {
	if (!isNumber(a) || !isNumber(b)) return null;
	return a < b;
}

/**
 * Checks if the first number is less than or equal to the second number.
 *
 * @category Numeric Predicates
 * @param a - The first number to compare.
 * @param b - The second number to compare.
 * @returns True if the first number is less than or equal, otherwise false. Returns null if either argument is not a number.
 */
export function isLessOrEqual(a: number, b: number): boolean | null {
	if (!isNumber(a) || !isNumber(b)) return null;
	return a <= b;
}

/**
 * Checks if a number is negative.
 *
 * @category Numeric Predicates
 * @param value - The number to check.
 * @returns True if the number is negative, otherwise false. Returns null if the argument is not a number.
 */
export function isNegative(value: number): boolean | null {
	if (!isNumber(value)) return null;
	return value < 0;
}

/**
 * Checks if a number is positive.
 *
 * @category Numeric Predicates
 * @param value - The number to check.
 * @returns True if the number is positive, otherwise false. Returns null if the argument is not a number.
 */
export function isPositive(value: number): boolean | null {
	if (!isNumber(value)) return null;
	return value >= 0;
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
export function contains(str: string, substr: string): boolean | null;

/**
 * Checks if an object contains a specified value.
 *
 * @category Lookup Predicates
 * @param obj - The object to check.
 * @param value - The value to check for.
 * @returns True if the value is found, otherwise false.
 */
export function contains<T extends object>(obj: T, value: T[keyof T]): boolean | null;

/**
 * Checks if an array contains a specified value.
 *
 * @category Lookup Predicates
 * @param list - The array to check.
 * @param value - The value to check for.
 * @returns True if the value is found, otherwise false.
 */
export function contains<T, V>(list: ArrayLike<T>, value: V): boolean | null;

export function contains(container: string | object | any[], value: any): boolean | null {
	if (isString(container) && isString(value)) return container.includes(value);
	if (isArray(container)) return some(container, item => isEqual(item, value));
	if (isObject(container) && !isNull(container)) return values(container).some(item => isEqual(item, value));
	return null;
}

/**
 * Checks if an array has a specified index.
 *
 * @category Lookup Predicates
 * @param list - The array to check.
 * @param index - The index to check for.
 * @returns True if the index is found, otherwise false.
 */
export function has<T>(list: T[], index: number): boolean | null;

/**
 * Checks if an object has a specified key.
 *
 * @category Lookup Predicates
 * @param obj - The object to check.
 * @param key - The key to check for.
 * @returns True if the key is found, otherwise false.
 */
export function has<T extends object>(obj: T, key: keyof T): boolean | null;

export function has(container: any[] | object, keyOrIndex: number | keyof any): boolean | null {
	if (isArray(container) && isNumber(keyOrIndex)) return !!container[keyOrIndex];
	if (isObject(container) && !isNull(container) && isString(keyOrIndex)) return keyOrIndex in container;
	return null;
}

export { isEqual, isNull };
