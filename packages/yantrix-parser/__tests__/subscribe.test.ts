import { describe, expect, it } from 'vitest';
import { getSubscribeStatements, YantrixParser } from '../src';

describe('subscribe', () => {
	it('should parse valid subscribe statement', () => {
		const parser = new YantrixParser();
		const result = parser.parse('subscribe/TestEvent TestAction');
		const subscribes = getSubscribeStatements(result);

		expect(subscribes).toHaveLength(1);
		expect(subscribes[0]!.identifier).toBe('TestEvent');
		expect(subscribes[0]!.actionName).toBe('TestAction');
	});

	it('should throw error without event name', () => {
		expect(() => new YantrixParser().parse(`subscribe/ TestAction`)).toThrowError();
	});

	it('should throw error without action', () => {
		expect(() => new YantrixParser().parse(`subscribe/TestEvent`)).toThrowError();
	});
});
