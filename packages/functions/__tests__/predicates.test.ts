import { describe, expect, it } from 'vitest';
import { builtInFunctions } from '../src';

describe('function Tests', () => {
	// Logical predicates
	describe('and Function', () => {
		it('should return true if all conditions are true', () => {
			expect(builtInFunctions.and(true, true, true)).toBe(true);
		});

		it('should return false if any condition is false', () => {
			expect(builtInFunctions.and(true, false, true)).toBe(false);
		});

		it('should handle empty input gracefully', () => {
			expect(builtInFunctions.and()).toBe(true);
		});
	});

	describe('or Function', () => {
		it('should return true if any condition is true', () => {
			expect(builtInFunctions.or(false, true, false)).toBe(true);
		});

		it('should return false if all conditions are false', () => {
			expect(builtInFunctions.or(false, false, false)).toBe(false);
		});

		it('should handle empty input gracefully', () => {
			expect(builtInFunctions.or()).toBe(false);
		});
	});

	describe('not Function', () => {
		it('should negate a boolean value', () => {
			expect(builtInFunctions.not(true)).toBe(false);
			expect(builtInFunctions.not(false)).toBe(true);
		});
	});

	describe('none Function', () => {
		it('should return true if all conditions are false', () => {
			expect(builtInFunctions.none(false, false, false)).toBe(true);
		});

		it('should return true if any condition is true', () => {
			expect(builtInFunctions.none(false, true, false)).toBe(true);
		});

		it('should handle empty input gracefully', () => {
			expect(builtInFunctions.none()).toBe(false);
		});
	});

	// Numeric predicates
	describe('isEven Function', () => {
		it('should return true for even numbers', () => {
			expect(builtInFunctions.isEven(2)).toBe(true);
			expect(builtInFunctions.isEven(-4)).toBe(true);
		});

		it('should return false for odd numbers', () => {
			expect(builtInFunctions.isEven(3)).toBe(false);
			expect(builtInFunctions.isEven(-5)).toBe(false);
		});

		it('should return null for invalid inputs', () => {
			expect(builtInFunctions.isEven(null as any)).toBeNull();
			expect(builtInFunctions.isEven('a' as any)).toBeNull();
		});
	});

	describe('isOdd Function', () => {
		it('should return true for odd numbers', () => {
			expect(builtInFunctions.isOdd(3)).toBe(true);
			expect(builtInFunctions.isOdd(-5)).toBe(true);
		});

		it('should return false for even numbers', () => {
			expect(builtInFunctions.isOdd(2)).toBe(false);
			expect(builtInFunctions.isOdd(-4)).toBe(false);
		});

		it('should return null for invalid inputs', () => {
			expect(builtInFunctions.isOdd(null as any)).toBeNull();
			expect(builtInFunctions.isOdd('a' as any)).toBeNull();
		});
	});

	describe('isInteger Function', () => {
		it('should return true for integers', () => {
			expect(builtInFunctions.isInteger(5)).toBe(true);
			expect(builtInFunctions.isInteger(-10)).toBe(true);
		});

		it('should return false for non-integers', () => {
			expect(builtInFunctions.isInteger(5.5)).toBe(false);
			expect(builtInFunctions.isInteger(-10.1)).toBe(false);
		});

		it('should return null for invalid inputs', () => {
			expect(builtInFunctions.isInteger(null as any)).toBeNull();
			expect(builtInFunctions.isInteger('a' as any)).toBeNull();
		});
	});

	describe('isGreater Function', () => {
		it('should return true if the first number is greater than the second', () => {
			expect(builtInFunctions.isGreater(5, 3)).toBe(true);
		});

		it('should return false if the first number is not greater than the second', () => {
			expect(builtInFunctions.isGreater(3, 5)).toBe(false);
			expect(builtInFunctions.isGreater(5, 5)).toBe(false);
		});

		it('should return null for invalid inputs', () => {
			expect(builtInFunctions.isGreater(null as any, 5)).toBeNull();
			expect(builtInFunctions.isGreater(5, 'a' as any)).toBeNull();
		});
	});

	describe('isGreaterOrEqual Function', () => {
		it('should return true if the first number is greater than or equal to the second', () => {
			expect(builtInFunctions.isGreaterOrEqual(5, 3)).toBe(true);
			expect(builtInFunctions.isGreaterOrEqual(5, 5)).toBe(true);
		});

		it('should return false if the first number is less than the second', () => {
			expect(builtInFunctions.isGreaterOrEqual(3, 5)).toBe(false);
		});

		it('should return null for invalid inputs', () => {
			expect(builtInFunctions.isGreaterOrEqual(null as any, 5)).toBeNull();
			expect(builtInFunctions.isGreaterOrEqual(5, 'a' as any)).toBeNull();
		});
	});

	describe('isLess Function', () => {
		it('should return true if the first number is less than the second', () => {
			expect(builtInFunctions.isLess(3, 5)).toBe(true);
		});

		it('should return false if the first number is not less than the second', () => {
			expect(builtInFunctions.isLess(5, 3)).toBe(false);
			expect(builtInFunctions.isLess(5, 5)).toBe(false);
		});

		it('should return null for invalid inputs', () => {
			expect(builtInFunctions.isLess(null as any, 5)).toBeNull();
			expect(builtInFunctions.isLess(5, 'a' as any)).toBeNull();
		});
	});

	describe('isLessOrEqual Function', () => {
		it('should return true if the first number is less than or equal to the second', () => {
			expect(builtInFunctions.isLessOrEqual(3, 5)).toBe(true);
			expect(builtInFunctions.isLessOrEqual(5, 5)).toBe(true);
		});

		it('should return false if the first number is greater than the second', () => {
			expect(builtInFunctions.isLessOrEqual(5, 3)).toBe(false);
		});

		it('should return null for invalid inputs', () => {
			expect(builtInFunctions.isLessOrEqual(null as any, 5)).toBeNull();
			expect(builtInFunctions.isLessOrEqual(5, 'a' as any)).toBeNull();
		});
	});

	describe('isNegative Function', () => {
		it('should return true for negative numbers', () => {
			expect(builtInFunctions.isNegative(-5)).toBe(true);
		});

		it('should return false for non-negative numbers', () => {
			expect(builtInFunctions.isNegative(0)).toBe(false);
			expect(builtInFunctions.isNegative(5)).toBe(false);
		});

		it('should return null for invalid inputs', () => {
			expect(builtInFunctions.isNegative(null as any)).toBeNull();
			expect(builtInFunctions.isNegative('a' as any)).toBeNull();
		});
	});

	describe('isPositive Function', () => {
		it('should return true for non-negative numbers', () => {
			expect(builtInFunctions.isPositive(0)).toBe(true);
			expect(builtInFunctions.isPositive(5)).toBe(true);
		});

		it('should return false for negative numbers', () => {
			expect(builtInFunctions.isPositive(-5)).toBe(false);
		});

		it('should return null for invalid inputs', () => {
			expect(builtInFunctions.isPositive(null as any)).toBeNull();
			expect(builtInFunctions.isPositive('a' as any)).toBeNull();
		});
	});

	// Lookup predicates
	describe('contains Function', () => {
		it('should check if a string contains a substring', () => {
			expect(builtInFunctions.contains('hello', 'ell')).toBe(true);
			expect(builtInFunctions.contains('hello', 'abc')).toBe(false);
		});

		it('should check if an array contains a value', () => {
			expect(builtInFunctions.contains([1, 2, 3], 2)).toBe(true);
			expect(builtInFunctions.contains([1, 2, 3], 4)).toBe(false);
		});

		it('should check if an object contains a value', () => {
			expect(builtInFunctions.contains({ a: 1, b: 2 }, 2)).toBe(true);
			expect(builtInFunctions.contains({ a: 1, b: 2 }, 3)).toBe(false);
		});

		it('should return null for invalid inputs', () => {
			expect(builtInFunctions.contains(null as any, 'a')).toBeNull();
			expect(builtInFunctions.contains('hello', null as any)).toBeNull();
		});
	});

	describe('has Function', () => {
		it('should check if an array has an index', () => {
			expect(builtInFunctions.has([1, 2, 3], 1)).toBe(true);
			expect(builtInFunctions.has([1, 2, 3], 5)).toBe(false);
		});

		it('should check if an object has a key', () => {
			expect(builtInFunctions.has({ a: 1, b: 2 }, 'a')).toBe(true);
			// eslint-disable-next-line ts/ban-ts-comment
			// @ts-expect-error
			expect(builtInFunctions.has({ a: 1, b: 2 }, 'c')).toBe(false);
		});

		it('should return null for invalid inputs', () => {
			expect(builtInFunctions.has(null as any, 'a')).toBeNull();
			// eslint-disable-next-line ts/ban-ts-comment
			// @ts-expect-error
			expect(builtInFunctions.has('hello', 1 as any)).toBeNull();
		});
	});

	describe('isEqual Function', () => {
		it('should compare two values for equality', () => {
			expect(builtInFunctions.isEqual(1, 1)).toBe(true);
			expect(builtInFunctions.isEqual(1, 2)).toBe(false);
		});

		it('should handle deep equality for objects and arrays', () => {
			expect(builtInFunctions.isEqual({ a: 1 }, { a: 1 })).toBe(true);
			expect(builtInFunctions.isEqual([1, 2], [1, 2])).toBe(true);
			expect(builtInFunctions.isEqual({ a: 1 }, { a: 2 })).toBe(false);
		});
	});

	describe('isNull Function', () => {
		it('should return true for null values', () => {
			expect(builtInFunctions.isNull(null)).toBe(true);
			expect(builtInFunctions.isNull(undefined)).toBe(false);
		});

		it('should return false for non-null values', () => {
			expect(builtInFunctions.isNull(0)).toBe(false);
			expect(builtInFunctions.isNull('')).toBe(false);
		});
	});
});
