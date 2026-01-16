import { describe, expect, it } from 'vitest';
import { getInjectStatements, YantrixParser } from '../src';

describe('inject', () => {
	it('grammar support inject', () => {
		const parser = new YantrixParser();
		const input = `inject/isBoolean`;
		const output = parser.parse(input);
		const injects = getInjectStatements(output);

		expect(injects.length).equal(1);
		expect(injects[0]!.identifier).toBe('isBoolean');
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
