// ┌───────────────────────────────────────────────────────────────────────────┐
// │                                Statistics                                 │
// └───────────────────────────────────────────────────────────────────────────┘

import { mult } from './maths';
import { invalid } from './utils/errors';

/**
 * Returns the maximum value from a list of numbers.
 *
 * @category Statistics
 * @param nums - Numbers or arrays of numbers to evaluate.
 * @returns The maximum value found.
 */
export function max(...nums: number[]): number | null;
export function max(nums: number[]): number | null;
export function max(...nums: [number[]] | number[]): number | null {
	const flatNums = nums.flat();
	if (!flatNums.length) return null;
	let mx = -Infinity;
	for (let i = 0; i < flatNums.length; i++) {
		if (!Number.isFinite(flatNums[i])) return invalid('ALL_ARGUMENTS_MUST_BE_NUMBERS');
		if (flatNums[i]! > mx) mx = flatNums[i]!;
	}
	return mx;
};

/**
 * Returns the minimum value from a list of numbers.
 *
 * @category Statistics
 * @param nums - Numbers or arrays of numbers to evaluate.
 * @returns The minimum value found.
 */
export function min(...nums: number[]): number | null;
export function min(nums: number[]): number | null;
export function min(...nums: [number[]] | number[]): number | null {
	const flatNums = nums.flat();
	if (!flatNums?.length) return null;
	let mn = Infinity;
	for (let i = 0; i < flatNums.length; i++) {
		if (!Number.isFinite(flatNums[i])) return invalid('ALL_ARGUMENTS_MUST_BE_NUMBERS');
		if (flatNums[i]! < mn) mn = flatNums[i]!;
	}
	return mn;
};

/**
 * Returns the sum of a list of numbers.
 *
 * @category Statistics
 * @param nums - Numbers or arrays of numbers to evaluate.
 * @returns The sum of the numbers.
 */
export function sum(...nums: number[]): number | null;
export function sum(nums: number[]): number | null;
export function sum(...nums: [number[]] | number[]): number | null {
	const flatNums = nums.flat();
	if (!flatNums?.length) return null;
	return flatNums.reduce((sum, num) => (!Number.isFinite(num))
		? invalid('ALL_ARGUMENTS_MUST_BE_NUMBERS')
		: sum + num, 0);
}

/**
 * Returns the average value from a list of numbers.
 *
 * @category Statistics
 * @param nums - Numbers or array of numbers to evaluate.
 * @returns The average of all values.
 */
export function avg(...nums: number[]): number | null;
export function avg(nums: number[]): number | null;
export function avg(...nums: [number[]] | number[]): number | null {
	const flatNums = nums.flat();
	if (!flatNums?.length) return null;
	return (sum(...flatNums) ?? invalid('INVALID_NUMERIC_ARGUMENT')) / flatNums.length;
};

/**
 * Returns the median value from a list of numbers.
 *
 * @category Statistics
 * @param nums - Numbers or arrays of numbers to evaluate.
 * @returns The median value.
 */
export function med(...nums: number[]): number | null;
export function med(nums: number[]): number | null;
export function med(...nums: [number[]] | number[]): number | null {
	const flatNums = nums.flat();
	if (!flatNums.length) return null;
	if (!flatNums.every(t => Number.isFinite(t))) return invalid('INVALID_NUMERIC_ARGUMENT');

	const sorted = flatNums.sort();
	const middle = Math.floor(sorted.length / 2);

	return sorted.length % 2
		? sorted[middle]!
		: (sorted[middle - 1]! + sorted[middle]!) / 2;
};

/**
 * Returns the sum of the squares of a list of numbers.
 *
 * @category Statistics
 * @param nums - Numbers or arrays of numbers to evaluate.
 * @returns The sum of the squares of the numbers.
 */
export function sumsq(...nums: number[]): number | null;
export function sumsq(nums: number[]): number | null;
export function sumsq(...nums: [number[]] | number[]): number | null {
	const flatNums = nums.flat();
	if (!flatNums.length) return null;
	return flatNums.reduce((acc, num) => acc + num * num, 0);
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
