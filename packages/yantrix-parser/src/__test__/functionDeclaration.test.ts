import { assert, describe, test } from 'vitest';
import { YantrixParser } from '../yantrixParser.js';
import { functionsFixtures } from './fixtures/keyItem.js';

const cases = [
	[`#{property = func()}`, functionsFixtures.expression],
	[`#{property=func(property)}`, functionsFixtures.withProperty],
	[`#{property=func('string')}`, functionsFixtures.withString],
	[`#{property=func(3)}`, functionsFixtures.withInteger],
	[`#{property=func(first,second)}`, functionsFixtures.multiplyProperty],
	[`#{property=func(function())}`, functionsFixtures.recursive],
];

describe('Function declaration', () => {
	test.each(cases)('%s', (input, res) => {
		const output = new YantrixParser().parse(input as string);
		assert.deepOwnInclude(output, res);
	});
});
