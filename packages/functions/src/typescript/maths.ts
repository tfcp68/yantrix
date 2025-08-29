// ┌───────────────────────────────────────────────────────────────────────────┐
// │                         Arithmetic Transformers                           │
// └───────────────────────────────────────────────────────────────────────────┘

import { isPositiveInteger } from '@yantrix/utils';
import * as _ from 'lodash-es';
import { invalid } from './utils/errors';

/**
 * Adds a list of numbers together.
 *
 * @category Arithmetics
 * @param nums - Numbers or arrays of numbers.
 * @returns The sum of the numbers.
 */
export function add(nums: number[]): number | null;
export function add(...nums: number[]): number | null;
export function add(...nums: [number[]] | number[]): number | null {
	if (!nums?.length) return null;
	const flatNums = nums.flat();
	let sum = 0;
	for (let i = 0; i < flatNums.length; i++) {
		if (!Number.isFinite(flatNums[i])) return invalid('ALL_ARGUMENTS_MUST_BE_NUMBERS');
		sum += flatNums[i]!;
	}
	return sum;
};

/**
 * Subtracts the second number from the first number.
 *
 * @category Arithmetics
 * @param a - The first number.
 * @param b - The second number to subtract from the first.
 * @returns The difference between the numbers, or null if any argument is nil.
 */
export function diff(a: number, b: number) {
	return (Number.isFinite(a) && Number.isFinite(b)) ? b - a : invalid('ALL_ARGUMENTS_MUST_BE_NUMBERS');
}

/**
 * Multiplies a list of numbers.
 *
 * @category Arithmetics
 * @param nums - Numbers or arrays of numbers to multiply.
 * @returns The product of the numbers.
 */
export function mult(...nums: number[]): number | null;
export function mult(nums: number[]): number | null;
export function mult(...nums: [number[]] | number[]): number | null {
	if (!nums?.length) return null;
	const flatNums = nums.flat();
	let product = 1;
	for (let i = 0; i < flatNums.length; i++) {
		if (!Number.isFinite(flatNums[i])) return invalid('ALL_ARGUMENTS_MUST_BE_NUMBERS');
		product *= flatNums[i]!;
	}
	return product;
};

/**
 * Divides the first number by the second number.
 *
 * @category Arithmetics
 * @param a - The dividend.
 * @param b - The divisor.
 * @returns The quotient of the division
 */
export function div(a: number, b: number) {
	return (Number.isFinite(a) && Number.isFinite(b))
		? b === 0
			? invalid('DIVISION_BY_ZERO')
			: a / b
		: invalid('INVALID_ARGUMENTS');
}

/**
 * Raises the first number to the power of the second number.
 *
 * @category Arithmetics
 * @returns The result of raising the base to the exponent.
 * @param n
 * @param exp
 */
export function pow(n: number, exp: number) {
	return (Number.isFinite(n) && Number.isFinite(exp))
		? n ** exp
		: invalid('INVALID_ARGUMENTS');
}

/**
 * Increments a number by 1.
 *
 * @category Arithmetics
 * @param n - The number to increment.
 * @returns The number incremented by 1
 */
export function inc(n: number) {
	return add(n, 1);
}

/**
 * Decrements a number by 1.
 *
 * @category Arithmetics
 * @param n - The number to decrement.
 * @returns The number decremented by 1
 */
export function dec(n: number) {
	return add(n, -1);
}

/**
 * Negates a number.
 *
 * @category Arithmetics
 * @param n - The number to negate.
 * @returns The negated number
 */
export function neg(n: number) {
	return mult(n, -1);
}

/**
 * Inverts a number.
 *
 * @category Arithmetics
 * @param n - The number to invert.
 * @returns The reciprocal of the number (1/n)
 */
export function inv(n: number) {
	return div(1, n);
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
	return Number.isFinite(a) && Number.isFinite(b)
		? a % b
		: invalid('INVALID_ARGUMENTS');
}
/**
 * Truncates a number to its integer part.
 *
 * @category Arithmetics
 * @param num - The number to truncate.
 * @returns The integer part of the number.
 */
export function trunc(n: number) {
	return Number.isFinite(n) ? Math.trunc(n) : invalid('INVALID_NUMERIC_ARGUMENT');
}
/**
 * Rounds a number up to the nearest integer.
 *
 * @category Arithmetics
 * @returns The smallest integer greater than or equal to the number.
 * @param n
 */
export function ceil(n: number) {
	return Number.isFinite(n) ? Math.ceil(n) : invalid('INVALID_NUMERIC_ARGUMENT');
}

/**
 * Rounds a number to the nearest integer or to specified precision.
 *
 * @category Arithmetics
 * @param n
 * @param precision - The number of decimal places to round to (default: 0).
 * @returns The rounded number.
 */
export function round(n: number, precision: number = 0) {
	if (_.isNil(n)) return null;
	if (!Number.isFinite(n)) return invalid('INVALID_NUMERIC_ARGUMENT');
	if (!isPositiveInteger(precision) && precision !== 0)
		return invalid('INVALID_PRECISION_ARGUMENT');

	const factor = 10 ** precision;
	return Math.round(n * factor) / factor;
}
