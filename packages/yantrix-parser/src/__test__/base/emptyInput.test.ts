import { assert, describe, expect, test } from 'vitest';
import { YantrixParser } from '../../yantrixParser.js';

const defaultEmpty = {
	contextDescription: [],
	emit: [],
	subscribe: [],
};
describe('Empty declaration', () => {
	test('should be an empty declaration dictionary', () => {
		const parser = new YantrixParser().parse('');

		assert.deepInclude(parser, defaultEmpty);
	});
});
