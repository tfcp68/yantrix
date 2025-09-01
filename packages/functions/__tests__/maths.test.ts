import { describe, expect, it } from 'vitest';
import { Transformers } from '../src';
import { ERRORS } from '../src/typescript/utils/errors';

describe('arithmetic Transformers', () => {
	const { add, div, mult, diff, pow, trunc, round, inc, dec, neg, inv, mod, ceil } = Transformers;

	describe('add()', () => {
		it('should add numbers', () => {
			expect(add(1, 2, 3)).toBe(6);
		});

		it('should add numbers from array', () => {
			expect(add([1, 2, 3])).toBe(6);
		});

		it('should return null if no arguments provided', () => {
			expect(add()).toBeNull();
		});

		it('should throw if any argument is not a number', () => {
			expect(() => add(1 as any, 'a' as any)).toThrow(ERRORS.ALL_ARGUMENTS_MUST_BE_NUMBERS);
		});
	});

	describe('diff()', () => {
		it('should subtract numbers', () => {
			expect(diff(1, 5)).toBe(4);
		});

		it('should throw if arguments are invalid', () => {
			expect(() => diff(1, Number.NaN)).toThrow(ERRORS.ALL_ARGUMENTS_MUST_BE_NUMBERS);
		});
	});

	describe('mult()', () => {
		it('should multiply numbers', () => {
			expect(mult(2, 3, 4)).toBe(24);
		});

		it('should multiply numbers from array', () => {
			expect(mult([2, 3, 4])).toBe(24);
		});

		it('should return null if no arguments provided', () => {
			expect(mult()).toBeNull();
		});

		it('should throw if argument is NaN', () => {
			expect(() => mult(2, Number.NaN)).toThrow(ERRORS.ALL_ARGUMENTS_MUST_BE_NUMBERS);
		});
	});

	describe('div()', () => {
		it('should divide numbers', () => {
			expect(div(10, 2)).toBe(5);
		});

		it('should throw if dividing by zero', () => {
			expect(() => div(10, 0)).toThrow(ERRORS.DIVISION_BY_ZERO);
		});

		it('should throw if arguments are invalid', () => {
			expect(() => div(10, Number.NaN)).toThrow(ERRORS.INVALID_ARGUMENTS);
		});
	});

	describe('pow()', () => {
		it('should raise number to power', () => {
			expect(pow(2, 3)).toBe(8);
		});

		it('should throw if arguments are invalid', () => {
			expect(() => pow(2, Number.NaN)).toThrow(ERRORS.INVALID_ARGUMENTS);
			expect(() => pow(2, '3' as any)).toThrow(ERRORS.INVALID_ARGUMENTS);
		});
	});

	describe('inc()', () => {
		it('should increment number by 1', () => {
			expect(inc(5)).toBe(6);
		});
	});

	describe('dec()', () => {
		it('should decrement number by 1', () => {
			expect(dec(5)).toBe(4);
		});
	});

	describe('neg()', () => {
		it('should negate number', () => {
			expect(neg(5)).toBe(-5);
		});
	});

	describe('inv()', () => {
		it('should return reciprocal value', () => {
			expect(inv(4)).toBe(0.25);
		});

		it('should throw if dividing by zero', () => {
			expect(() => inv(0)).toThrow(ERRORS.DIVISION_BY_ZERO);
		});
	});

	describe('mod()', () => {
		it('should return modulus', () => {
			expect(mod(10, 3)).toBe(1);
		});

		it('should throw if arguments are invalid', () => {
			expect(() => mod(10, Number.NaN)).toThrow(ERRORS.INVALID_ARGUMENTS);
		});
	});

	describe('trunc()', () => {
		it('should truncate number', () => {
			expect(trunc(4.9)).toBe(4);
		});

		it('should throw if argument is invalid', () => {
			expect(() => trunc(Number.NaN)).toThrow(ERRORS.INVALID_NUMERIC_ARGUMENT);
		});
	});

	describe('ceil()', () => {
		it('should round number upwards', () => {
			expect(ceil(4.1)).toBe(5);
		});

		it('should throw if argument is invalid', () => {
			expect(() => ceil(Number.NaN)).toThrow(ERRORS.INVALID_NUMERIC_ARGUMENT);
		});
	});

	describe('round()', () => {
		it('should round to nearest integer', () => {
			expect(round(4.4)).toBe(4);
			expect(round(4.5)).toBe(5);
		});

		it('should round with precision', () => {
			expect(round(4.456, 2)).toBe(4.46);
		});

		it('should return null if number is null or undefined', () => {
			expect(round(null as any)).toBeNull();
			expect(round(undefined as any)).toBeNull();
		});

		it('should throw if argument is NaN', () => {
			expect(() => round(Number.NaN)).toThrow(ERRORS.INVALID_NUMERIC_ARGUMENT);
		});

		it('should throw if precision is invalid', () => {
			expect(() => round(4.5, -2)).toThrow(ERRORS.INVALID_PRECISION_ARGUMENT);
		});
	});
});
