import { describe, expect, it } from 'vitest';
import { YantrixParser } from '../src';

describe('inject', () => {
	it('grammar support inject', () => {
		const parser = new YantrixParser();
		const input = `inject/test`;
		const output = parser.parse(input);

		expect(output.inject.length).equal(1);
		expect(output.inject[0]).toStrictEqual({
			identifier: 'test',
		});
	});
});
