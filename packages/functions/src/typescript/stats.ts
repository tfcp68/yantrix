// ┌───────────────────────────────────────────────────────────────────────────┐
// │                                Statistics                                 │
// └───────────────────────────────────────────────────────────────────────────┘

import { mult } from './maths';
import { invalid } from './utils/errors';

/**
 * Returns the maximum value from a list of numbers.
 *
 * @category Statistics
 * @param nums - An array of numbers to evaluate.
 * @returns The maximum value found in the array.
 */
export const max = (...nums: number[]) => {
	if (!nums?.length) return null;
	let mx = -Infinity;
	for (let i = 0; i < nums.length; i++) {
		if (!Number.isFinite(nums[i])) return invalid('ALL_ARGUMENTS_MUST_BE_NUMBERS');
		if (nums[i]! > mx) mx = nums[i]!;
	}
	return mx;
};

/**
 * Returns the minimum value from a list of numbers.
 *
 * @category Statistics
 * @param nums - An array of numbers to evaluate.
 * @returns The minimum value found in the array.
 */
export const min = (...nums: number[]) => {
	if (!nums?.length) return null;
	let mn = Infinity;
	for (let i = 0; i < nums.length; i++) {
		if (!Number.isFinite(nums[i])) return invalid('ALL_ARGUMENTS_MUST_BE_NUMBERS');
		if (nums[i]! < mn) mn = nums[i]!;
	}
	return mn;
};

/**
 * Returns the sum of a list of numbers.
 *
 * @category Statistics
 * @param nums - An array of numbers to evaluate.
 * @returns The sum of the numbers in the array.
 */
export const sum = (list: number[]) => {
	if (!list?.length) return null;
	return list.reduce((sum, num) => sum + num, 0);
};

/**
 * Returns the average value from a list of numbers.
 *
 * @category Statistics
 * @param nums - An array of numbers to evaluate.
 * @returns The average of all values of the array.
 */
export const avg = (...nums: number[]) => {
	return nums.length ? (sum(nums) ?? invalid('INVALID_NUMERIC_ARGUMENT')) / nums.length : null;
};

/**
 * Returns the median value from a list of numbers.
 *
 * @category Statistics
 * @param nums - An array of numbers to evaluate.
 * @returns The median value of the array.
 */
export const med = (...nums: number[]) => {
	if (!nums.length) return null;
	if (!nums.every(t => Number.isFinite(t))) return invalid('INVALID_NUMERIC_ARGUMENT');

	const sorted = nums.sort();
	const middle = Math.floor(sorted.length / 2);

	return sorted.length % 2
		? sorted[middle]!
		: (sorted[middle - 1]! + sorted[middle]!) / 2;
};

/**
 * Returns the sum of the squares of a list of numbers.
 *
 * @category Statistics
 * @param nums - An array of numbers to evaluate.
 * @returns The sum of the squares of the numbers in the array.
 */
export const sumsq = (...nums: number[]) => {
	if (!nums.length) return null;
	return nums.reduce((acc, num) => acc + num * num, 0);
};

/**
 * Returns the sum of the products of corresponding numbers in multiple lists.
 *
 * @category Statistics
 * @param nums_lists - Multiple arrays of numbers to evaluate.
 * @returns The sum of the products of corresponding numbers.
 */
export const sumProduct = (...lists: number[][]) => {
	const tuples: number[][] = Array.from({ length: Math.max(...lists.map(t => t.length)) });
	if (!lists.length) return null;
	for (const list of lists) {
		if (!Array.isArray(list)) return invalid('ALL_ARGUMENTS_MUST_BE_LISTS');
		if (list.length < tuples.length) return invalid('LIST_LENGTH_MISMATCH');
		for (let i = 0; i < list.length; i++) {
			if (!Number.isFinite(list[i])) return invalid('ALL_LIST_ITEMS_MUST_BE_NUMERIC');
			if (!tuples[i]) tuples[i] = [];
			tuples[i] = (tuples[i] || []).concat(list[i]!);
		}
	}
	return sum(tuples.map(t => mult(...t)!));
};
