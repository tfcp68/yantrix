import { describe, expect, it } from 'vitest';
import { builtInFunctions } from '../../src';

describe('function Tests', () => {
	// Arithmetic transformers
	describe('add Function', () => {
		it('should return the sum of numbers', () => {
			expect(builtInFunctions.add(1, 2, 3)).toBe(6);
			expect(builtInFunctions.add(0)).toBe(0);
		});

		it('should throw an error for non-numeric inputs', () => {
			expect(() => builtInFunctions.add(1, 'a' as any)).toThrowError();
		});
	});

	describe('diff Function', () => {
		it('should return the difference between two numbers', () => {
			expect(builtInFunctions.diff(5, 10)).toBe(5);
			expect(builtInFunctions.diff(10, 5)).toBe(-5);
		});

		it('should return null for invalid inputs', () => {
			expect(builtInFunctions.diff(null as any, 5)).toBeNull();
			expect(builtInFunctions.diff(5, null as any)).toBeNull();
		});

		it('should throw an error for non-numeric inputs', () => {
			expect(() => builtInFunctions.diff('a' as any, 5)).toThrowError();
		});
	});

	describe('mult Function', () => {
		it('should return the product of numbers', () => {
			expect(builtInFunctions.mult(2, 3, 4)).toBe(24);
			expect(builtInFunctions.mult(1)).toBe(1);
		});

		it('should throw an error for non-numeric inputs', () => {
			expect(() => builtInFunctions.mult(2, 'a' as any)).toThrowError();
		});
	});

	describe('div Function', () => {
		it('should return the division result', () => {
			expect(builtInFunctions.div(10, 2)).toBe(5);
		});

		it('should throw an error for division by zero', () => {
			expect(() => builtInFunctions.div(10, 0)).toThrowError();
		});

		it('should throw an error for non-numeric inputs', () => {
			expect(() => builtInFunctions.div('a' as any, 5)).toThrowError();
		});
	});

	describe('pow Function', () => {
		it('should return the power of a number', () => {
			expect(builtInFunctions.pow(2, 3)).toBe(8);
		});

		it('should return null for invalid inputs', () => {
			expect(builtInFunctions.pow(null as any, 3)).toBeNull();
		});
	});

	describe('inc Function', () => {
		it('should increment a number', () => {
			expect(builtInFunctions.inc(5)).toBe(6);
		});

		it('should return null for invalid inputs', () => {
			expect(builtInFunctions.inc(null as any)).toBeNull();
		});
	});

	describe('dec Function', () => {
		it('should decrement a number', () => {
			expect(builtInFunctions.dec(5)).toBe(4);
		});

		it('should return null for invalid inputs', () => {
			expect(builtInFunctions.dec(null as any)).toBeNull();
		});
	});

	describe('neg Function', () => {
		it('should negate a number', () => {
			expect(builtInFunctions.neg(5)).toBe(-5);
		});

		it('should return null for invalid inputs', () => {
			expect(builtInFunctions.neg(null as any)).toBeNull();
		});
	});

	describe('inv Function', () => {
		it('should return the inverse of a number', () => {
			expect(builtInFunctions.inv(2)).toBe(0.5);
		});

		it('should return null for invalid inputs', () => {
			expect(builtInFunctions.inv(null as any)).toBeNull();
		});
	});

	describe('mod Function', () => {
		it('should return the modulus of two numbers', () => {
			expect(builtInFunctions.mod(7, 3)).toBe(1);
		});

		it('should return null for invalid inputs', () => {
			expect(builtInFunctions.mod(null as any, 3)).toBeNull();
		});
	});

	describe('trunc Function', () => {
		it('should truncate a number', () => {
			expect(builtInFunctions.trunc(5.9)).toBe(5);
		});

		it('should return null for invalid inputs', () => {
			expect(builtInFunctions.trunc(null as any)).toBeNull();
		});
	});

	describe('ceil Function', () => {
		it('should round up a number', () => {
			expect(builtInFunctions.ceil(5.1)).toBe(6);
		});

		it('should return null for invalid inputs', () => {
			expect(builtInFunctions.ceil(null as any)).toBeNull();
		});
	});

	describe('round Function', () => {
		it('should round a number', () => {
			expect(builtInFunctions.round(5.5)).toBe(6);
		});

		it('should return null for invalid inputs', () => {
			expect(builtInFunctions.round(null as any)).toBeNull();
		});
	});

	// Special math transformers
	describe('sin Function', () => {
		it('should calculate the sine of a number', () => {
			expect(builtInFunctions.sin(Math.PI / 2)).toBeCloseTo(1);
		});

		it('should return null for invalid inputs', () => {
			expect(builtInFunctions.sin(null as any)).toBeNull();
		});
	});

	describe('cos Function', () => {
		it('should calculate the cosine of a number', () => {
			expect(builtInFunctions.cos(0)).toBeCloseTo(1);
		});

		it('should return null for invalid inputs', () => {
			expect(builtInFunctions.cos(null as any)).toBeNull();
		});
	});

	describe('sqrt Function', () => {
		it('should calculate the square root of a number', () => {
			expect(builtInFunctions.sqrt(9)).toBe(3);
		});

		it('should return null for invalid inputs', () => {
			expect(builtInFunctions.sqrt(null as any)).toBeNull();
		});
	});

	describe('log Function', () => {
		it('should calculate the logarithm of a number', () => {
			expect(builtInFunctions.log(100, 10)).toBe(2);
		});

		it('should return null for invalid inputs', () => {
			expect(builtInFunctions.log(null as any, 10)).toBeNull();
		});
	});

	describe('ln Function', () => {
		it('should calculate the natural logarithm of a number', () => {
			expect(builtInFunctions.ln(Math.E)).toBeCloseTo(1);
		});

		it('should return null for invalid inputs', () => {
			expect(builtInFunctions.ln(null as any)).toBeNull();
		});
	});

	describe('lg Function', () => {
		it('should calculate the base-10 logarithm of a number', () => {
			expect(builtInFunctions.lg(100)).toBe(2);
		});

		it('should return null for invalid inputs', () => {
			expect(builtInFunctions.lg(null as any)).toBeNull();
		});
	});

	describe('deg Function', () => {
		it('should convert radians to degrees', () => {
			expect(builtInFunctions.deg(Math.PI)).toBe(180);
		});

		it('should return null for invalid inputs', () => {
			expect(builtInFunctions.deg(null as any)).toBeNull();
		});
	});

	describe('rad Function', () => {
		it('should convert degrees to radians', () => {
			expect(builtInFunctions.rad(180)).toBeCloseTo(Math.PI);
		});

		it('should return null for invalid inputs', () => {
			expect(builtInFunctions.rad(null as any)).toBeNull();
		});
	});

	// Statistics transformers
	describe('max Function', () => {
		it('should return the maximum value', () => {
			expect(builtInFunctions.max(1, 2, 3)).toBe(3);
		});

		it('should throw an error for non-numeric inputs', () => {
			expect(() => builtInFunctions.max(1, 'a' as any)).toThrowError();
		});
	});

	describe('min Function', () => {
		it('should return the minimum value', () => {
			expect(builtInFunctions.min(1, 2, 3)).toBe(1);
		});

		it('should throw an error for non-numeric inputs', () => {
			expect(() => builtInFunctions.min(1, 'a' as any)).toThrowError();
		});
	});

	describe('avg Function', () => {
		it('should return the average of numbers', () => {
			expect(builtInFunctions.avg(1, 2, 3)).toBe(2);
		});

		it('should throw an error for non-numeric inputs', () => {
			expect(() => builtInFunctions.avg(1, 'a' as any)).toThrowError();
		});
	});

	describe('med Function', () => {
		it('should return the median of numbers', () => {
			expect(builtInFunctions.med(1, 2, 3)).toBe(2);
			expect(builtInFunctions.med(1, 2, 3, 4)).toBe(2.5);
		});

		it('should throw an error for non-numeric inputs', () => {
			expect(() => builtInFunctions.med(1, 'a' as any)).toThrowError();
		});
	});

	describe('sum Function', () => {
		it('should return the sum of numbers', () => {
			expect(builtInFunctions.sum(1, 2, 3)).toBe(6);
		});

		it('should throw an error for non-numeric inputs', () => {
			expect(() => builtInFunctions.sum(1, 'a' as any)).toThrowError();
		});
	});

	describe('sumsq Function', () => {
		it('should return the sum of squares of numbers', () => {
			expect(builtInFunctions.sumsq(1, 2, 3)).toBe(14);
		});

		it('should throw an error for non-numeric inputs', () => {
			expect(() => builtInFunctions.sumsq(1, 'a' as any)).toThrowError();
		});
	});

	describe('sumProduct Function', () => {
		it('should calculate the sum of products', () => {
			expect(builtInFunctions.sumProduct([1, 2], [3, 4])).toBe(11);
		});

		it('should throw an error for invalid inputs', () => {
			expect(() => builtInFunctions.sumProduct([1, 2], 'a' as any)).toThrowError();
		});
	});

	// List and string transformers
	describe('len Function', () => {
		it('should return the length of a string or array', () => {
			expect(builtInFunctions.len('hello')).toBe(5);
			expect(builtInFunctions.len([1, 2, 3])).toBe(3);
		});

		it('should return 0 for invalid inputs', () => {
			expect(builtInFunctions.len(null as any)).toBe(0);
		});
	});

	describe('left Function', () => {
		it('should return the left part of a string or array', () => {
			expect(builtInFunctions.left('hello', 2)).toBe('he');
			expect(builtInFunctions.left([1, 2, 3, 4], 2)).toEqual([1, 2]);
		});

		it('should handle invalid inputs gracefully', () => {
			expect(builtInFunctions.left(null as any, 2)).toBeNull();
		});
	});

	describe('right Function', () => {
		it('should return the right part of a string or array', () => {
			expect(builtInFunctions.right('hello', 2)).toBe('lo');
			expect(builtInFunctions.right([1, 2, 3, 4], 2)).toEqual([3, 4]);
		});

		it('should handle invalid inputs gracefully', () => {
			expect(builtInFunctions.right(null as any, 2)).toBeNull();
		});
	});

	describe('indexOf Function', () => {
		it('should find the index of a value in a string or array', () => {
			expect(builtInFunctions.indexOf('hello', 'e')).toBe(1);
			expect(builtInFunctions.indexOf([1, 2, 3], 2)).toBe(1);
		});

		it('should return -1 for missing values', () => {
			expect(builtInFunctions.indexOf('hello', 'z')).toBe(-1);
		});

		it('should handle invalid inputs gracefully', () => {
			expect(builtInFunctions.indexOf(null as any, 'a')).toBe(-1);
		});
	});

	describe('shuffle Function', () => {
		it('should shuffle a string or array', () => {
			const input = 'abc';
			const shuffled = builtInFunctions.shuffle(input);
			expect(shuffled.length).toBe(input.length);
			expect(shuffled.split('').sort()
				.join('')).toBe(input.split('').sort()
				.join(''));
		});

		it('should handle invalid inputs gracefully', () => {
			expect(builtInFunctions.shuffle(null as any)).toBeNull();
		});
	});

	// List transformers
	describe('lookup Function', () => {
		it('should find the first matching value in an array', () => {
			expect(builtInFunctions.lookup([1, 2, 3], 2)).toBe(2);
		});

		it('should return null for missing values', () => {
			expect(builtInFunctions.lookup([1, 2, 3], 4)).toBeNull();
		});

		it('should handle invalid inputs gracefully', () => {
			expect(builtInFunctions.lookup(null as any, 2)).toBeNull();
		});
	});

	describe('repeat Function', () => {
		it('should repeat a value a specified number of times', () => {
			expect(builtInFunctions.repeat(3, 'a')).toEqual(['a', 'a', 'a']);
		});

		it('should handle invalid inputs gracefully', () => {
			expect(builtInFunctions.repeat(-1, 'a')).toEqual([]);
		});
	});

	// String transformers
	describe('substr Function', () => {
		it('should extract a substring from a string', () => {
			expect(builtInFunctions.substr('hello', 1, 3)).toBe('el');
		});

		it('should handle invalid inputs gracefully', () => {
			expect(builtInFunctions.substr(null as any, 1, 3)).toBe('');
		});
	});

	// Collection transformers
	describe('filterBy Function', () => {
		it('should filter objects by a property value', () => {
			const data = [
				{ id: 1, name: 'Alice' },
				{ id: 2, name: 'Bob' },
				{ id: 3, name: 'Alice' },
			];
			expect(builtInFunctions.filterBy(data, 'name', 'Alice')).toEqual([
				{ id: 1, name: 'Alice' },
				{ id: 3, name: 'Alice' },
			]);
		});

		it('should handle invalid inputs gracefully', () => {
			expect(builtInFunctions.filterBy(null as any, 'name', 'Alice')).toEqual([]);
		});
	});
});
