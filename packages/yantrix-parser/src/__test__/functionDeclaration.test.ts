import { assert, describe, test } from 'vitest';
import { YantrixParser } from '../yantrixParser.js';
import { functionsFixtures } from '../fixtures/keyItem.js';
import { randomString, randomInteger } from '@yantrix/utils';

const generateCases = () => {
	const cases: any[] = [];
	const [propertyName1, funcName1, funcPropertyName1, funcPropertyName2, funcPropertyName3, funcRecursiveName1] =
		Array.apply(null, Array(6)).map(() => randomString().toLowerCase()) as string[];
	const stringProperty = `'${randomString().toLowerCase()}'`;
	const integerProperty = randomInteger();
	cases.push(
		[`#{${propertyName1}=${funcName1}()}`, functionsFixtures.expression(propertyName1, funcName1)],
		[
			`#{${propertyName1}=${funcName1}(${funcPropertyName1})}`,
			functionsFixtures.withProperty(propertyName1, funcName1, funcPropertyName1),
		],
		[
			`#{${propertyName1}=${funcName1}(${stringProperty})}`,
			functionsFixtures.withString(propertyName1, funcName1, stringProperty),
		],
		[
			`#{${propertyName1}=${funcName1}(${integerProperty})}`,
			functionsFixtures.withInteger(propertyName1, funcName1, integerProperty),
		],
		[
			`#{${propertyName1}=${funcName1}(${funcPropertyName2},${funcPropertyName3})}`,
			functionsFixtures.multiplyProperty(propertyName1, funcName1, funcPropertyName2, funcPropertyName3),
		],
		[
			`#{${propertyName1}=${funcName1}(${funcRecursiveName1}())}`,
			functionsFixtures.recursive(propertyName1, funcName1, funcRecursiveName1),
		],
	);
	return cases;
};

describe('Function declaration', () => {
	const cases = generateCases() as Array<Array<any>>;
	for (let i = 0; i < cases.length; i++) {
		const [input, res] = cases[i];
		test(input, () => {
			const output = new YantrixParser().parse(input as string);
			assert.deepOwnInclude(output, res);
		});
	}
});
