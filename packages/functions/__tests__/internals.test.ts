import { randomInteger } from '@yantrix/utils';
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

describe('weightedRandom Function', () => {
	const weightedRandom = internalFunctions.weightedRandom;

	const iterations = 10000;

	it('should return a key based on its weight', () => {
		const keys = ['a', 'b', 'c'];

		const weights = Object.fromEntries(keys.map(key => [key, randomInteger(0, 10000)]));
		const weightSum = Object.values(weights).reduce((acc, weight) => acc + weight, 0);

		const expectedResultCount = Object.fromEntries(keys.map(key => [key, 0]));

		for (let i = 0; i < iterations; i++) {
			const result = weightedRandom(weights);
			expect(['a', 'b', 'c']).toContain(result);
			expectedResultCount[result]!++;
		}

		for (const [key, iterationCount] of Object.entries(expectedResultCount)) {
			const expectedCountForKey = Math.floor((weights[key]! / weightSum) * iterations);
			const tolerance = Math.floor(iterations * 0.05); // 5% tolerance
			const countIsCorrect = expectedCountForKey >= iterationCount - tolerance
				&& expectedCountForKey <= iterationCount + tolerance;
			expect(countIsCorrect, `[key: '${key}']Expected ${expectedCountForKey} to be in +-5%(${tolerance} iterations) tolerance range with ${iterationCount}`).toBe(true);
		}
	});

	it('should handle equal weights', () => {
		const keys = ['a', 'b', 'c'];

		const weight = randomInteger(1, 10000);
		const weights = Object.fromEntries(keys.map(key => [key, weight])); // {a: weight, b: weight, c: weight}
		const weightSum = Object.values(weights).reduce((acc, weight) => acc + weight, 0);

		const expectedResultCount = Object.fromEntries(keys.map(key => [key, 0]));

		for (let i = 0; i < iterations; i++) {
			const result = weightedRandom(weights);
			expect(['a', 'b', 'c']).toContain(result);
			expectedResultCount[result]!++;
		}

		for (const [key, iterationCount] of Object.entries(expectedResultCount)) {
			const expectedCountForKey = Math.floor((weights[key]! / weightSum) * iterations);
			const tolerance = Math.floor(iterations * 0.05); // 5% tolerance
			const countIsCorrect = expectedCountForKey >= iterationCount - tolerance
				&& expectedCountForKey <= iterationCount + tolerance;
			expect(countIsCorrect, `[key: '${key}']Expected ${expectedCountForKey} to be in +-5%(${tolerance} iterations) tolerance range with ${iterationCount}`).toBe(true);
		}
	});

	it('should handle a single key with weight', () => {
		for (let i = 0; i < iterations; i++) {
			const weights = { a: randomInteger(1, 100) };
			const result = weightedRandom(weights);
			expect(result).toBe('a');
		}
	});

	it('should throw an error if the object is empty', () => {
		const weights = {};
		expect(() => weightedRandom(weights)).toThrow('Weighted random object is empty');
	});

	it('should throw an error if any weight is not an integer', () => {
		const nonIntegerValues = [Number.NaN, Infinity, -Infinity, 1.5, 'string', true, false, [], {}];
		for (const value of nonIntegerValues) {
			const weights = { a: 1, b: value as any, c: 3 };
			expect(() => weightedRandom(weights)).toThrow('Weighted random object contains non-integer values');
		}
	});

	it('should throw an error if any weight is negative', () => {
		const weights = { a: 1, b: -2, c: 3 };
		expect(() => weightedRandom(weights)).toThrow('Weighted random object contains values of 0 or less');
	});

	it('should throw an error if any weight is zero', () => {
		const weights = { a: 1, b: 0, c: 3 };
		expect(() => weightedRandom(weights)).toThrow('Weighted random object contains values of 0 or less');
	});
});
