import { describe, expect, it } from 'vitest';
import { YantrixParser } from '../src/index.js';

describe('state description', () => {
	const parser = new YantrixParser();

	it('by default  state description should be false', async () => {
		const result = await parser.parse('inject/isBoolean');

		expect(result.initialState).toBe(false);
		expect(result.byPass).toBe(false);
	});
	it('result object should be include state description', async () => {
		const result = await parser.parse('+init +byPass');

		expect(result.initialState).toBe(true);
		expect(result.byPass).toBe(true);
	});
});
