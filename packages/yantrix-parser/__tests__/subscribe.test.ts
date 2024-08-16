import { describe, expect, test } from 'vitest';
import { YantrixParser } from '../src/yantrixParser.js';

describe('Subscribe', () => {
	test('should be throw error without event name ', () => {
		expect(() => new YantrixParser().parse(`subscribe/ => action`)).toThrowError();
	});
	test('should be throw error without  action ', () => {
		expect(() => new YantrixParser().parse(`subscribe/test => `)).toThrowError();
	});
});
