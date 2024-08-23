import { describe, expect, it } from 'vitest';
import { YantrixParser } from '../src';

describe('state description', () => {
	const parser = new YantrixParser();

	it('by default  state description should be false', () => {
		const result = parser.parse('');

		expect(result.initialState).toBe(false);
		expect(result.byPass).toBe(false);
	});
	it('result object should be include state description', () => {
		const result = parser.parse('+init +byPass');

		expect(result.initialState).toBe(true);
		expect(result.byPass).toBe(true);
	});
});
