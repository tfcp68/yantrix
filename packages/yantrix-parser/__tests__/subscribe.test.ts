import { describe, expect, it } from 'vitest';
import { YantrixParser } from '../src';

describe('subscribe', () => {
	it('should be throw error without event name ', () => {
		expect(() => new YantrixParser().parse(`subscribe/ => action`)).toThrowError();
	});
	it('should be throw error without  action ', () => {
		expect(() => new YantrixParser().parse(`subscribe/test => `)).toThrowError();
	});
});
