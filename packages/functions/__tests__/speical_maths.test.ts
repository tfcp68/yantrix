import { describe, expect, it } from 'vitest';
import { Transformers } from '../src';
import { ERRORS } from '../src/typescript/utils/errors';

describe('special Math Transformers', () => {
	const { cos, deg, lg, ln, log, rad, sin, sqrt } = Transformers;
	describe('sin()', () => {
		it('should return sine of a number', () => {
			expect(sin(Math.PI / 2)).toBeCloseTo(1);
		});

		it('should throw if argument is invalid', () => {
			expect(() => sin(Number.NaN)).toThrow(ERRORS.INVALID_NUMERIC_ARGUMENT);
			expect(() => sin(null as any)).toThrow(ERRORS.INVALID_NUMERIC_ARGUMENT);
			expect(() => sin(undefined as any)).toThrow(ERRORS.INVALID_NUMERIC_ARGUMENT);
			expect(() => sin('90' as any)).toThrow(ERRORS.INVALID_NUMERIC_ARGUMENT);
			expect(() => sin({} as any)).toThrow(ERRORS.INVALID_NUMERIC_ARGUMENT);
		});
	});

	describe('cos()', () => {
		it('should return cosine of a number', () => {
			expect(cos(0)).toBeCloseTo(1);
		});

		it('should throw if argument is invalid', () => {
			expect(() => cos(Infinity)).toThrow(ERRORS.INVALID_NUMERIC_ARGUMENT);
			expect(() => cos(null as any)).toThrow(ERRORS.INVALID_NUMERIC_ARGUMENT);
			expect(() => cos(undefined as any)).toThrow(ERRORS.INVALID_NUMERIC_ARGUMENT);
			expect(() => cos('0' as any)).toThrow(ERRORS.INVALID_NUMERIC_ARGUMENT);
			expect(() => cos([] as any)).toThrow(ERRORS.INVALID_NUMERIC_ARGUMENT);
		});
	});

	describe('sqrt()', () => {
		it('should return square root of a number', () => {
			expect(sqrt(16)).toBe(4);
		});

		it('should throw if argument is invalid', () => {
			expect(() => sqrt(Number.NaN)).toThrow(ERRORS.INVALID_NUMERIC_ARGUMENT);
			expect(() => sqrt(null as any)).toThrow(ERRORS.INVALID_NUMERIC_ARGUMENT);
			expect(() => sqrt(undefined as any)).toThrow(ERRORS.INVALID_NUMERIC_ARGUMENT);
			expect(() => sqrt('16' as any)).toThrow(ERRORS.INVALID_NUMERIC_ARGUMENT);
			expect(() => sqrt({} as any)).toThrow(ERRORS.INVALID_NUMERIC_ARGUMENT);
		});
	});

	describe('ln()', () => {
		it('should return natural logarithm of a number', () => {
			expect(ln(Math.E)).toBeCloseTo(1);
		});

		it('should return -Infinity for ln(0)', () => {
			expect(ln(0)).toBe(-Infinity);
		});

		it('should return Number.NaN for ln of negative number', () => {
			expect(ln(-5)).toBeNaN();
		});
	});

	describe('log()', () => {
		it('should return logarithm with given base', () => {
			expect(log(8, 2)).toBe(3);
		});

		it('should throw if base is invalid', () => {
			expect(() => log(8, -2)).toThrow(ERRORS.INVALID_ARGUMENTS);
		});

		it('should throw if num is invalid', () => {
			expect(() => log(Number.NaN, 10)).toThrow(ERRORS.INVALID_ARGUMENTS);
		});
	});

	describe('lg()', () => {
		it('should return base-10 logarithm', () => {
			expect(lg(100)).toBe(2);
		});

		it('should throw if argument is invalid', () => {
			expect(() => lg(Number.NaN)).toThrow(ERRORS.INVALID_ARGUMENTS);
			expect(() => lg(null as any)).toThrow(ERRORS.INVALID_ARGUMENTS);
			expect(() => lg(undefined as any)).toThrow(ERRORS.INVALID_ARGUMENTS);
			expect(() => lg('100' as any)).toThrow(ERRORS.INVALID_ARGUMENTS);
			expect(() => lg([] as any)).toThrow(ERRORS.INVALID_ARGUMENTS);
		});
	});

	describe('deg()', () => {
		it('should convert radians to degrees', () => {
			expect(deg(Math.PI)).toBeCloseTo(180);
		});

		it('should throw if argument is invalid', () => {
			expect(() => deg(Number.NaN)).toThrow(ERRORS.INVALID_NUMERIC_ARGUMENT);
			expect(() => deg(null as any)).toThrow(ERRORS.INVALID_NUMERIC_ARGUMENT);
			expect(() => deg(undefined as any)).toThrow(ERRORS.INVALID_NUMERIC_ARGUMENT);
			expect(() => deg('180' as any)).toThrow(ERRORS.INVALID_NUMERIC_ARGUMENT);
			expect(() => deg({} as any)).toThrow(ERRORS.INVALID_NUMERIC_ARGUMENT);
		});
	});

	describe('rad()', () => {
		it('should convert degrees to radians', () => {
			expect(rad(180)).toBeCloseTo(Math.PI);
		});

		it('should throw if argument is invalid', () => {
			expect(() => rad(Infinity)).toThrow(ERRORS.INVALID_NUMERIC_ARGUMENT);
			expect(() => rad(null as any)).toThrow(ERRORS.INVALID_NUMERIC_ARGUMENT);
			expect(() => rad(undefined as any)).toThrow(ERRORS.INVALID_NUMERIC_ARGUMENT);
			expect(() => rad('180' as any)).toThrow(ERRORS.INVALID_NUMERIC_ARGUMENT);
			expect(() => rad([] as any)).toThrow(ERRORS.INVALID_NUMERIC_ARGUMENT);
		});
	});
});
