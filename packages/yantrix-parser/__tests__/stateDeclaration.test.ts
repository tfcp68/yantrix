import { describe, expect, it } from 'vitest';
import { hasByPass, hasInitialState, YantrixParser } from '../src';

describe('state description', () => {
	const parser = new YantrixParser();

	it('by default state description should be false', () => {
		const result = parser.parse('');

		expect(hasInitialState(result)).toBe(false);
		expect(hasByPass(result)).toBe(false);
	});

	it('result object should include state description', () => {
		const result = parser.parse('+Init +ByPass');

		expect(hasInitialState(result)).toBe(true);
		expect(hasByPass(result)).toBe(true);
	});
});
