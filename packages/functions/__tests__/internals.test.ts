import { describe, expect, it } from 'vitest';
import { internalFunctions } from '../src';
import { randomInteger } from '@yantrix/utils';

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

	const iterations = 100;

    it('should return a key based on its weight', () => {
		
		for (let i = 0; i < iterations; i++) {
			const weights = { 
				a: randomInteger(1, 100),
				b: randomInteger(2, 100),
				c: randomInteger(3, 100)
			 };
			const result = weightedRandom(weights);
        	expect(['a', 'b', 'c']).toContain(result);
		}
    });

    it('should throw an error if any weight is NaN', () => {
        const weights = { a: 1, b: NaN, c: 3 };
        expect(() => weightedRandom(weights)).toThrow('Weighted random object contains NaN values');
	});
	
	it('should throw an error if any weight is negative', () => {
		const weights = { a: 1, b: -2, c: 3 };
		expect(() => weightedRandom(weights)).toThrow('Weighted random object contains negative values');
	});

    it('should handle a single key with weight', () => {
		for (let i = 0; i < iterations; i++) {
			const weights = { a: randomInteger(1, 100) };
			const result = weightedRandom(weights);
			expect(result).toBe('a');
		}
    });

    it('should handle equal weights', () => {
		for (let i = 0; i < iterations; i++) {
			const weight = randomInteger(1, 100);
			const weights = { a: weight, b: weight, c: weight };
			const result = weightedRandom(weights);
			expect(['a', 'b', 'c']).toContain(result);
		}
    });

    it('should handle zero weights correctly', () => {
		for (let i = 0; i < iterations; i++) {
			const weights = { a: 0, b: 0, c: randomInteger(1, 100) };
			const result = weightedRandom(weights);
			expect(result).toBe('c');
		}
    });

    it('should throw an error if the object is empty', () => {
        const weights = {};
        expect(() => weightedRandom(weights)).toThrow('Unexpected error, could not get weighted random value');
    });
});