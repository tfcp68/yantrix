import { beforeEach, describe, expect, it, vitest } from 'vitest';
import { FunctionDictionary } from '../src/FunctionDictionary';
import { TAutomataFunction } from '../src/types';

describe('functionDictionary', () => {
	let dict: FunctionDictionary;
	const mockFn: TAutomataFunction = vitest.fn(() => 'test');

	beforeEach(() => {
		dict = new FunctionDictionary();
	});

	describe('/register', () => {
		it('should register single function', () => {
			const result = dict.register('testFn', mockFn);
			expect(result).toEqual({ testFn: mockFn });
			expect(dict.has('testFn')).toBe(true);
		});

		it('should register multiple functions', () => {
			const fns = { fn1: mockFn, fn2: mockFn };
			const result = dict.register(fns);
			expect(result).toEqual(fns);
			expect(dict.has('fn1')).toBe(true);
			expect(dict.has('fn2')).toBe(true);
		});

		it('should throw on invalid function key', () => {
			expect(() => dict.register('', mockFn)).toThrow();
			expect(() => dict.register('1invalid', mockFn)).toThrow();
		});

		it('should throw on duplicate registration', () => {
			dict.register('testFn', mockFn);
			expect(() => dict.register('testFn', mockFn)).toThrow();
		});
	});

	describe('/get', () => {
		it('should return registered function', () => {
			dict.register('testFn', mockFn);
			expect(dict.get('testFn')).toBe(mockFn);
		});

		it('should throw if function not found', () => {
			expect(() => dict.get('missing')).toThrow();
		});
	});

	describe('/call', () => {
		it('should call registered function', () => {
			const args = [1, 2] as const;
			const spy = vitest.fn().mockReturnValue(args[0] + args[1]);
			dict.register('testFn', spy);
			const result = dict.call('testFn', args[0], args[1]);
			expect(spy).toHaveBeenCalledWith(args[0], args[1]);
			expect(result).toBe(args[0] + args[1]);
		});
	});

	describe('/clear', () => {
		it('should clear all functions', () => {
			dict.register('testFn', mockFn);
			dict.clear();
			expect(dict.has('testFn')).toBe(false);
		});
	});
});
