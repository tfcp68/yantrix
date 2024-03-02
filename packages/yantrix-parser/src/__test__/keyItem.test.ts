import { assert, describe, test } from 'vitest';
import { YantrixParser } from '../yantrixParser.js';
import { functionsFixtures, keyItem } from './fixtures/keyItem.js';

describe('Key list', () => {
	describe('single key item', () => {
		test('should be return KeyItemDeclaration with TargetProperty', () => {
			const parser = new YantrixParser().parse('#{property}');

			assert.deepOwnInclude(parser, keyItem.declarationKeyItem);
		});
		test('should be return KeyItem declaration with initial string expression', () => {
			const parser = new YantrixParser().parse(`#{property  = 'string'}`);

			assert.deepInclude(parser, keyItem.withStringInitial);
		});
		test('should be return KeyItem declaration with initial array expression', () => {
			const parser = new YantrixParser().parse(`#{property = []}`);

			assert.deepInclude(parser, keyItem.withArrayInitial);
		});
		test('should be return KeyItem declaration with initial integerValue expression', () => {
			const parser = new YantrixParser().parse(`#{property = 3}`);

			assert.deepInclude(parser, keyItem.withIntegerInitial);
		});
		test('should be return KeyItem declaration with base function expression', () => {
			const parser = new YantrixParser().parse(`#{property = func()}`);

			assert.deepInclude(parser, functionsFixtures.expression);
		});
		test('should be return KeyItem declaration with property declaration', () => {
			const parser = new YantrixParser().parse(
				`#{property = anotherProperty}`,
			);

			assert.deepInclude(parser, keyItem.withPropertyInitial);
		});
	});
});
