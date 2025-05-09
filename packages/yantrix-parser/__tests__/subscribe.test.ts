import { describe, expect, it } from 'vitest';
import { YantrixParser } from '../src/core/yantrixParser';

describe('subscribe', () => {
	it('should be throw error without event name ', async () => {
		await expect(async () => await (new YantrixParser().parse(`subscribe/ => action`))).rejects.toThrowError();
	});
	it('should be throw error without  action ', async () => {
		await expect(async () => await (new YantrixParser().parse(`subscribe/test => `))).rejects.toThrowError();
	});
});
