import { describe, expect, it } from 'vitest';
import { internalFunctions } from '../src';

describe('random Function', () => {
	const iterations = 1000;

	it(`should return either 0 or 1 when no arguments are provided (${iterations} iterations)`, () => {
		for (let i = 0; i < iterations; i++) {
			const result = internalFunctions.random();
			expect([0, 1]).toContain(result);
		}
	});

	it(`should return a random number between min and max (inclusive of min, exclusive of max) (${iterations} iterations)`, () => {
		const min = 5;
		const max = 10;
		for (let i = 0; i < iterations; i++) {
			const result = internalFunctions.random(min, max);
			expect(result).toBeGreaterThanOrEqual(min);
			expect(result).toBeLessThan(max);
		}
	});

	it(`should handle edge cases with negative ranges (${iterations} iterations)`, () => {
		const min = -10;
		const max = -5;
		for (let i = 0; i < iterations; i++) {
			const result = internalFunctions.random(min, max);
			expect(result).toBeGreaterThanOrEqual(min);
			expect(result).toBeLessThan(max);
		}
	});
});
