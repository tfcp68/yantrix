import { every, isArray, map } from 'lodash-es';
import { TNestedArray } from './types';

/**
 * Recursively flattens nested arrays until a specific condition is met.
 *
 * @template T - The type of elements in the array
 * @param {TNestedArray<T>} array - The nested array to flatten
 * @returns {TNestedArray<T>} A flattened array that maintains some nesting structure based on conditions:
 * - If input is not an array, returns single-element array containing the input
 * - If input is empty array, returns empty array
 * - If input has single element that is an array, recursively flattens that element
 * - If input has multiple elements that are all arrays, maps flatMapUntilLength over them
 * - Otherwise returns the original array unchanged
 *
 * @example
 * flatMapUntilLength(1)              // Returns [1]
 * flatMapUntilLength([])             // Returns []
 * flatMapUntilLength([[1]])          // Returns [1]
 * flatMapUntilLength([[1], [2]])     // Returns [[1], [2]]
 * flatMapUntilLength([1, [2]])       // Returns [1, [2]]
 */
export function flatMapUntilLength<T>(array: TNestedArray<T>): TNestedArray<T> {
	if (!isArray(array)) return [array];
	if (!array.length) return [];

	if (array.length === 1) {
		if (isArray(array[0])) return flatMapUntilLength(array[0] as TNestedArray<T>);
		return array;
	}

	return array.length >= 2 && every(array, isArray) ? map(array, flatMapUntilLength) as TNestedArray<T> : array;
}

/**
 * Creates a variadic function wrapper that accepts nested arrays as arguments and flattens them
 * before passing to the original function.
 *
 * @template T - The type of elements in the input arrays
 * @template R - The return type of the function, defaults to T
 * @param {function(T[]): R} fn - The function to wrap that takes an array of T and returns R
 * @returns {function(...TNestedArray<T>): R} A variadic function that accepts nested arrays and returns R
 *
 * @example
 * const sum = variadic((nums: number[]) => nums.reduce((a, b) => a + b, 0));
 * sum(1, 2, 3);           // Returns 6
 * sum([1, [2, [3]]]);     // Returns 6
 * sum([[1], 2], [[3]]);   // Returns 6
 *
 * @remarks
 * The wrapper function will:
 * 1. Accept any number of arguments that can be nested arrays
 * 2. Flatten the arguments using flatMapUntilLength
 * 3. Pass the flattened array to the original function
 */
export function variadic<T, R = T>(fn: (conditions: T[]) => R) {
	return function (...args: TNestedArray<T>): R {
		const conditions = flatMapUntilLength(args);
		return fn(conditions as T[]);
	};
}
