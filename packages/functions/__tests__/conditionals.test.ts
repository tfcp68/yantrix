import { describe, expect, it } from 'vitest';
import { randomArray, randomInteger, randomValue } from '../../utils/src';
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

	describe('choose Function', () => {
		const choose = builtInFunctions.choose;

		it('should return the option at the given index', () => {
			for (let i = 0; i < 10; i++) {
				const randomArgs = randomArray(randomValue, randomInteger()); // array of random amount of arguments with random types
				const expectedArgIndex = Math.floor(Math.random() * randomArgs.length);
				const expectedArg = randomArgs[expectedArgIndex];
				expect(choose(expectedArgIndex, ...randomArgs)).toBe(expectedArg);
				expect(typeof choose(expectedArgIndex, ...randomArgs)).toBe(typeof expectedArg);
			}
		});

		it('should return undefined when index is out of bounds', () => {
			expect(choose(3, 'a', 'b', 'c')).toBeUndefined();
		});

		it('should return undefined when no options are provided', () => {
			expect(choose(0)).toBeUndefined();
		});

		it('should return undefined when index is negative', () => {
			expect(choose(-1, 'a', 'b', 'c')).toBeUndefined();
		});
	});
});
