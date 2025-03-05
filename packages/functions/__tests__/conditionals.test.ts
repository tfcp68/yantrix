import { describe, expect, it } from 'vitest';
import { builtInFunctions } from '../src';

describe('function Tests', () => {
	describe('case Function', () => {
		it('should return the value for a true condition (simple case)', () => {
			expect(builtInFunctions.case(true, 'Value if true', 'Value if false')).toBe('Value if true');
		});

		it('should return the alternative value for a false condition (simple case)', () => {
			expect(builtInFunctions.case(false, 'Value if true', 'Value if false')).toBe('Value if false');
		});

		it('should handle multiple conditions and return the first matching value', () => {
			expect(
				builtInFunctions.case(
					false,
					'Value 1',
					true,
					'Value 2',
					'Default Value',
				),
			).toBe('Value 2');
		});

		it('should handle an array of pairs and return the first matching value', () => {
			const pairs = [
				[false, 'Value 1'],
				[true, 'Value 2'],
				[false, 'Value 3'],
			];
			expect(builtInFunctions.case(pairs)).toBe('Value 2');
		});

		it('should handle nested arrays of pairs and return the first matching value', () => {
			const nestedPairs = [
				[[false, 'Value 1'], [true, 'Value 2']],
				[[false, 'Value 3']],
			];
			expect(builtInFunctions.case(nestedPairs)).toBe('Value 2');
		});

		it('should return null if no conditions match and no alternative is provided', () => {
			expect(builtInFunctions.case(false, 'Value')).toBe(null);
		});
	});

	describe('coalesce Function', () => {
		it('should return the first non-null/undefined value', () => {
			expect(builtInFunctions.coalesce(null, undefined, 'First Valid', 'Second Valid')).toBe('First Valid');
		});

		it('should return null if all values are null or undefined', () => {
			expect(builtInFunctions.coalesce(null, undefined)).toBe(null);
		});

		it('should handle empty input gracefully', () => {
			expect(builtInFunctions.coalesce()).toBe(null);
		});
	});

	describe('if Function', () => {
		it('should return the true value when the condition is true', () => {
			expect(builtInFunctions.if(true, 'True Value', 'False Value')).toBe('True Value');
		});

		it('should return the false value when the condition is false', () => {
			expect(builtInFunctions.if(false, 'True Value', 'False Value')).toBe('False Value');
		});
	});

	describe('random Function', () => {
		const iterations = 1000;

		it(`should return either 0 or 1 when no arguments are provided (${iterations} iterations)`, () => {
			for (let i = 0; i < iterations; i++) {
				const result = builtInFunctions.random();
				expect([0, 1]).toContain(result);
			}
		});

		it(`should return a random number between min and max (inclusive of min, exclusive of max) (${iterations} iterations)`, () => {
			const min = 5;
			const max = 10;
			for (let i = 0; i < iterations; i++) {
				const result = builtInFunctions.random(min, max);
				expect(result).toBeGreaterThanOrEqual(min);
				expect(result).toBeLessThan(max);
			}
		});

		it(`should handle edge cases with negative ranges (${iterations} iterations)`, () => {
			const min = -10;
			const max = -5;
			for (let i = 0; i < iterations; i++) {
				const result = builtInFunctions.random(min, max);
				expect(result).toBeGreaterThanOrEqual(min);
				expect(result).toBeLessThan(max);
			}
		});
	});
});
