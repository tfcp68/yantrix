import { YantrixParser } from '../src';
import { test, describe, expect } from 'vitest';

describe('State description', () => {
	const parser = new YantrixParser();

	test('By default  state description should be false', () => {
		const result = parser.parse('');

		expect(result.initialState).toBe(false);
		expect(result.byPass).toBe(false);
	});
	test('Result object should be include state description', () => {
		const result = parser.parse('+init +byPass');

		expect(result.initialState).toBe(true);
		expect(result.byPass).toBe(true);
	});
});
