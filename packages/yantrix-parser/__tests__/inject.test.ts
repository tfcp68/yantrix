import { describe, expect, it } from 'vitest';
import { YantrixParser } from '../src/index.js';

describe('inject', () => {
	it('grammar support inject', async () => {
		const parser = new YantrixParser();
		const input = `inject/isBoolean`;
		const output = await parser.parse(input);

		expect(output.inject.length).equal(1);
		expect(output.inject[0]).toStrictEqual({
			identifier: 'isBoolean',
		});
	});

	it('should reject invalid inject directive syntax', async () => {
		const parser = new YantrixParser();
		const input = `inject isBoolean`;
		await expect(parser.parse(input)).rejects.toThrow();
	});

	it('should reject inject directive with empty identifier', async () => {
		const parser = new YantrixParser();
		const input = `inject/`;

		await expect(parser.parse(input)).rejects.toThrow();
	});
});
