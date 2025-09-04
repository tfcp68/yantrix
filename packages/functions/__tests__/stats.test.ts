import { describe, expect, it } from 'vitest';
import { Transformers } from '../src';
import { ERRORS } from '../src/typescript/utils/errors';

describe('statistics functions', () => {
	const { med, max, avg, sumProduct, sum, sumsq, min } = Transformers;
	// ─────────── MAX ───────────
	describe('max()', () => {
		it('returns maximum from list of numbers', () => {
			expect(max(1, 5, 3)).toBe(5);
		});

		it('returns maximum from array', () => {
			expect(max([1, 5, 3])).toBe(5);
		});

		it('returns null for empty input', () => {
			expect(max()).toBeNull();
			expect(max([])).toBeNull();
		});

		it('throws when non-numeric passed', () => {
			expect(() => max(1, 'a' as any)).toThrow(ERRORS.ALL_ARGUMENTS_MUST_BE_NUMBERS);
		});
	});

	// ─────────── MIN ───────────
	describe('min()', () => {
		it('returns minimum from list of numbers', () => {
			expect(min(1, 5, 3)).toBe(1);
		});

		it('returns minimum from array', () => {
			expect(min([1, 5, 3])).toBe(1);
		});

		it('returns null for empty input', () => {
			expect(min()).toBeNull();
			expect(min([])).toBeNull();
		});

		it('throws when non-numeric passed', () => {
			expect(() => min(1, true as any)).toThrow(ERRORS.ALL_ARGUMENTS_MUST_BE_NUMBERS);
		});
	});

	// ─────────── SUM ───────────
	describe('sum()', () => {
		it('returns sum from list of numbers', () => {
			expect(sum(1, 2, 3)).toBe(6);
		});

		it('returns sum from array', () => {
			expect(sum([1, 2, 3])).toBe(6);
		});

		it('returns null for empty input', () => {
			expect(sum()).toBeNull();
			expect(sum([])).toBeNull();
		});

		it('throws when non-numeric passed', () => {
			expect(() => sum(1, 2, '3' as any)).toThrow(ERRORS.ALL_ARGUMENTS_MUST_BE_NUMBERS);
		});
	});

	// ─────────── AVG ───────────
	describe('avg()', () => {
		it('returns average from list of numbers', () => {
			expect(avg(2, 4, 6)).toBe(4);
		});

		it('returns average from array', () => {
			expect(avg([2, 4, 6])).toBe(4);
		});

		it('returns null for empty input', () => {
			expect(avg()).toBeNull();
			expect(avg([])).toBeNull();
		});
	});

	// ─────────── MED ───────────
	describe('med()', () => {
		it('returns median for odd length', () => {
			expect(med(1, 3, 2)).toBe(2);
		});

		it('returns median for even length', () => {
			expect(med(1, 2, 3, 4)).toBe(2.5);
		});

		it('works with array input', () => {
			expect(med([10, 20, 30])).toBe(20);
		});

		it('returns null for empty input', () => {
			expect(med()).toBeNull();
			expect(med([])).toBeNull();
		});

		it('throws when non-numeric passed', () => {
			expect(() => med([1, 3, '5' as any])).toThrow(ERRORS.INVALID_NUMERIC_ARGUMENT);
		});
	});

	// ─────────── SUMSQ ───────────
	describe('sumsq()', () => {
		it('returns sum of squares for list', () => {
			expect(sumsq(1, 2, 3)).toBe(1 + 4 + 9);
		});

		it('returns sum of squares for array', () => {
			expect(sumsq([1, 2, 3])).toBe(1 + 4 + 9);
		});

		it('returns null for empty input', () => {
			expect(sumsq()).toBeNull();
			expect(sumsq([])).toBeNull();
		});
	});

	// ─────────── SUMPRODUCT ───────────
	describe('sumProduct()', () => {
		it('returns sum of products of corresponding numbers', () => {
			expect(sumProduct([1, 2, 3], [4, 5, 6])).toBe(32);
		});

		it('handles more than two lists', () => {
			expect(sumProduct([1, 2, 3], [4, 5, 6], [7, 8, 9])).toBe(270);
		});

		it('returns null for empty input', () => {
			expect(sumProduct()).toBeNull();
		});

		it('throws error on mismatched list length', () => {
			expect(() => sumProduct([1, 2], [3, 4, 5])).toThrow();
		});
	});
});
