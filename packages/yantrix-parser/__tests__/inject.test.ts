import { describe, expect, it } from 'vitest';
import { YantrixParser } from '../src';

describe('inject', () => {
	it('grammar support inject', () => {
		const parser = new YantrixParser();
		const input = `inject/isBoolean`;
		const output = parser.parse(input);

		expect(output.inject.length).equal(1);
		expect(output.inject[0]).toStrictEqual({
			identifier: 'isBoolean',
		});
	});

	it('should reject invalid inject directive syntax', () => {
		const parser = new YantrixParser();
		const input = `inject isBoolean`;

		expect(() => parser.parse(input)).toThrow();
	});

	it('should reject inject directive with empty identifier', () => {
		const parser = new YantrixParser();
		const input = `inject/`;

		expect(() => parser.parse(input)).toThrow();
	});
});
