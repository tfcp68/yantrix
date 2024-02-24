import { assert, describe, expect, test } from 'vitest';
import { YantrixParser } from '../yantrixParser.js';
import fixtures from './fixtures/index.js';

describe('Emit declaration', () => {
	describe('without key list', () => {
		test('Should be error without name', () => {
			const handler = () =>
				new YantrixParser().parse(fixtures.getEventEmitDeclaration(''));

			expect(() => handler()).toThrowError();
		});
		test('Should be parsed with valid name', () => {
			const parser = new YantrixParser().parse(
				fixtures.getEventEmitDeclaration('test'),
			);

			assert.deepInclude(parser, { emit: [{ eventName: 'test' }] });
		});
	});
});
