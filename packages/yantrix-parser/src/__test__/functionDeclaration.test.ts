import { assert, describe, test } from 'vitest';
import { YantrixParser } from '../yantrixParser.js';
import { functionsFixtures } from './fixtures/keyItem.js';

describe('Function declaration', () => {
	test('should be return function declaration', () => {
		const parser = new YantrixParser().parse('#{property = func()}');

		assert.deepInclude(parser, functionsFixtures.expression);
	});
	test('should be return function declaration with functionProperty', () => {
		const parser = new YantrixParser().parse('#{property=func(property)}');

		assert.deepInclude(parser, functionsFixtures.withProperty);
	});
	test('should be return function declaration with string declaration', () => {
		const parser = new YantrixParser().parse(`#{property=func('string')}`);

		assert.deepInclude(parser, functionsFixtures.withString);
	});
	test('should be return function declaration with integer declaration', () => {
		const parser = new YantrixParser().parse('#{property=func(3)}');

		assert.deepInclude(parser, functionsFixtures.withInteger);
	});
	test('should be return function declaration with two property arguments declaration', () => {
		const parser = new YantrixParser().parse(
			'#{property=func(first,second)}',
		);

		assert.deepInclude(parser, functionsFixtures.multiplyProperty);
	});
	test('should be return function declaration with recursive function declaration', () => {
		const parser = new YantrixParser().parse(
			'#{property=func(function())}',
		);

		assert.deepInclude(parser, functionsFixtures.recursive);
	});
});
