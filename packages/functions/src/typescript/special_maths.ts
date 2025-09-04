// ┌───────────────────────────────────────────────────────────────────────────┐
// │                        Special Math Transformers                          │
// └───────────────────────────────────────────────────────────────────────────┘

import { isPositiveNumber } from '@yantrix/utils';
import { invalid } from './utils/errors';

/**
 * Calculates the sine of a number.
 *
 * @category Special Maths
 * @param n - The number to calculate the sine of (in radians).
 * @returns The sine of the number
 */
export function sin(n: number) {
	return Number.isFinite(n) ? Math.sin(n) : invalid('INVALID_NUMERIC_ARGUMENT');
}
/**
 * Calculates the cosine of a number.
 *
 * @category Special Maths
 * @param n - The number to calculate the cosine of (in radians).
 * @returns The cosine of the number
 */
export function cos(n: number) {
	return Number.isFinite(n) ? Math.cos(n) : invalid('INVALID_NUMERIC_ARGUMENT');
}
/**
 * Calculates the square root of a number.
 *
 * @category Special Maths
 * @param n - The number to calculate the square root of.
 * @returns The square root of the number
 */
export function sqrt(n: number) {
	return Number.isFinite(n) ? Math.sqrt(n) : invalid('INVALID_NUMERIC_ARGUMENT');
}

/**
 * Calculates the natural logarithm (base e) of a number.
 *
 * @category Special Maths
 * @param n - The number to calculate the natural logarithm of., or null if the argument is nil.
 */
export function ln(n: number) {
	return Math.log(n);
}

/**
 * Calculates the logarithm of a number with a specified base.
 *
 * @category Special Maths
 * @param num - The number to calculate the logarithm of.
 * @param base - The base of the logarithm.
 * @returns The logarithm of the number with the specified base.
 */
export function log(num: number, base: number) {
	return (Number.isFinite(num) && isPositiveNumber(base))
		? ln(num) / ln(base)
		: invalid('INVALID_ARGUMENTS');
}

/**
 * Calculates the base-10 logarithm of a number.
 *
 * @category Special Maths
 * @param n - The number to calculate the base-10 logarithm of.
 * @returns The base-10 logarithm of the number
 */
export function lg(n: number) {
	return log(n, 10);
}
/**
 * Converts a number from radians to degrees.
 *
 * @category Special Maths
 * @param rads - The angle in radians to convert to degrees.
 * @returns The angle in degrees
 */
export function deg(rads: number) {
	return Number.isFinite(rads) ? rads * (180 / Math.PI) : invalid('INVALID_NUMERIC_ARGUMENT');
}
/**
 * Converts a number from degrees to radians.
 *
 * @category Special Maths
 * @param degs - The angle in degrees to convert to radians.
 * @returns The angle in radians, or null if the argument is nil.
 */
export function rad(degs: number) {
	return Number.isFinite(degs) ? degs * (Math.PI / 180) : invalid('INVALID_NUMERIC_ARGUMENT');
}
