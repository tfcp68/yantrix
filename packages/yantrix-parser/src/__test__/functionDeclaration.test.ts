import { assert, describe, expect, test } from 'vitest';
import { YantrixParser } from '../yantrixParser.js';
import { functionsFixtures } from '../fixtures/keyItem.js';
import {
	randomString,
	randomInteger,
	randomDecimal,
	randomValueFunction,
	randomValue,
	randomArray,
} from '@yantrix/utils';

const functionCasesAndExpectedTypes = [
	['#{%s = %s()}', functionsFixtures.expression],
	['#{%s = %s(%s)}', functionsFixtures.withProperty],
	['#{%s = %s("%s")}', functionsFixtures.withString],
	['#{%s = %s(%i)}', functionsFixtures.withInteger],
	['#{%s = %s(%d)}', functionsFixtures.withDecimal],
	['#{%s = %s(%arr)}', functionsFixtures.withArray],
	['#{%s = %s($(%s))}', functionsFixtures.withConstant],
	['#{%s = %s(%multi)}', functionsFixtures.multiplyProperty],
	['#{%s = %s(%s())}', functionsFixtures.recursive],
];

const validEmptyFunctionsExamples = ['#{%s = %s()}'];
const invalidEmptyFunctionsExamples = [
	'#{%s = %s ()}',
	'#{%s = ()}',
	'#{%s = %s[]}',
	'#{%s = %s{}}',
	'#{%s = %s({})}',
	'#{%s = %s(}',
	'#{%s = %s)}',
	'#{%s = %s(())}',
];

const validFunctionsWithArgumentsExamples = [
	'#{%s = %s(%s)}',
	'#{%s = %s("%s")}',
	'#{%s = %s(%i)}',
	'#{%s = %s(%d)}',
	'#{%s = %s(%arr)}',
	'#{%s = %s($(%s))}',
	'#{%s = %s(%s,%s)}',
	'#{%s = %s(%s,%i)}',
	'#{%s = %s(%i,%i)}',
	'#{%s = %s(%i,%d)}',
	'#{%s = %s(%d,%d)}',
	'#{%s = %s(%arr,%d)}',
	'#{%s = %s(%arr,%arr)}',
	'#{%s = %s(%f)}',
	'#{%s = %s(%f, %i)}',
	'#{%s = %s(,,,,,,)}',
];
const invalidFunctionsWithArgumentsExamples = [
	'#{%s = %s (%s)}',
	'#{%s = (%s)}',
	'#{%s = %s[%s]}',
	'#{%s = %s{%s}}',
	'#{%s = %s(%s}',
	'#{%s = %s((%s))}',
	'#{%s = %s([%s])}',
	'#{%s = %s("%s" %s)}',
	'#{%s = %s(%s.%s)}',
	'#{%s = %s(%s|%s)}',
	'#{%s = %s(%s=%s)}',
	'#{%s = %s(%s %d)}',
	'#{%s = %s(%s %i)}',
	'#{%s = %s(%s %s)}',
	'#{%s = %s(%d %i)}',
	'#{%s = %s("%s" %s)}',
	'#{%s = %s(%i%s)}',
	'#{%s = %s(%d%s)}',
	'#{%s = %s($())}',
	'#{%s = %s(#{%s})}',
];

// чуть бредово
const generateRandomStatementsFromTemplate = (arr: string[], casesAmount: number = randomInteger(1, 20)) => {
	return arr.flatMap((template) => {
		return Array.from({ length: casesAmount }, () =>
			template
				.replaceAll('%s', () => randomString())
				.replaceAll('%i', () => randomInteger().toString())
				.replaceAll('%d', () => randomDecimal().toString())
				.replaceAll('%rand', () => randomValue().toString())
				.replaceAll('%list', () => randomArray(randomString).join(','))
				.replaceAll('%arr', () => '[]')
				.replaceAll('%f', () => `${randomString()}()`),
		);
	});
};

// бредово
const generateFunctionString = (level: number = 0) => {
	if (level > 8) return; // todo check

	const argsTypes = [randomString, randomInteger, randomDecimal, generateFunctionString];
	const functionName = randomString();
	const argsCount = randomInteger(1, 10);
	const args = Array.from({ length: argsCount });
	for (let i = 0; i < argsCount; i++) {
		const randomIndex = Math.floor(Math.random() * argsTypes.length);
		if (randomIndex == 3) {
			const nestedFunction = generateFunctionString(level + 1);
			if (nestedFunction) args.push(nestedFunction);
		} else args.push(argsTypes[randomIndex]());
	}
	return `${functionName}(${args.join(',')})`;
};

// pzdc...
const generateExpressionStringAndExpectedObject = (
	args: [string, (prop?: string, func?: string, ...values: any) => any],
) => {
	const templateString = args[0];
	const func = args[1];

	// replacing property and function names with random strings
	const propertyName = randomString();
	const functionName = randomString();
	const templateStringWithNames = templateString.replace('%s', propertyName).replace('%s', functionName);

	// afterwards expecting different objects depending on the regex inside function arguments,
	// all names and values need to match to pass tests
	if (templateStringWithNames.match(/"%s"/)) {
		const val = randomString();
		return [templateStringWithNames.replace('"%s"', `"${val}"`), func(propertyName, functionName, `"${val}"`)];
	} else if (templateStringWithNames.match(/%s/)) {
		const val = randomString();
		return [templateStringWithNames.replace('%s', val), func(propertyName, functionName, val)];
	} else if (templateStringWithNames.match('%i')) {
		const val = randomInteger();
		return [templateStringWithNames.replace('%i', val.toString()), func(propertyName, functionName, val)];
	} else if (templateStringWithNames.match('%d')) {
		const val = randomDecimal();
		return [templateStringWithNames.replace('%d', val.toString()), func(propertyName, functionName, val)];
	} else if (templateStringWithNames.match('%multi')) {
		const propertyName1 = randomString();
		const propertyName2 = randomString();
		return [
			templateStringWithNames.replace('%multi', `${propertyName1},${propertyName2}`),
			func(propertyName, functionName, propertyName1, propertyName2),
		];
	} else if (templateStringWithNames.match('%arr')) {
		return [templateStringWithNames.replace('%arr', '[]'), func(propertyName, functionName)];
	} else return [templateStringWithNames, func(propertyName, functionName)];
};
const generateExpressionCases = (templates: any[], casesAmount: number = randomInteger(1, 50)) => {
	return templates.flatMap((template) => {
		return Array.from({ length: casesAmount }, () => generateExpressionStringAndExpectedObject(template));
	});
};

describe('Function declaration', () => {
	const parser = new YantrixParser();

	describe('Function strings with random sets of random arguments', () => {
		const cases = Array.from({ length: 1000 }, () => `#{${randomString()} = ${generateFunctionString()}}`);
		test.each(cases)('%s', (input) => {
			assert.isOk(parser.parse(input));
		});
	});

	describe('Empty functions syntax', () => {
		describe('Correct functions', () => {
			const cases = generateRandomStatementsFromTemplate(validEmptyFunctionsExamples);
			test.each(cases)('%s', (input) => {
				assert.isOk(parser.parse(input));
			});
		});

		describe('Incorrect functions', () => {
			const cases = generateRandomStatementsFromTemplate(invalidEmptyFunctionsExamples);
			test.each(cases)('%s', (input) => {
				expect(() => parser.parse(input)).toThrowError();
			});
		});
	});

	describe('Functions with arguments syntax', () => {
		describe('Correct functions', () => {
			const cases = generateRandomStatementsFromTemplate(validFunctionsWithArgumentsExamples);
			test.each(cases)('%s', (input) => {
				assert.isOk(parser.parse(input));
			});
		});

		describe('Incorrect functions', () => {
			const cases = generateRandomStatementsFromTemplate(invalidFunctionsWithArgumentsExamples);
			test.each(cases)('%s', (input) => {
				expect(() => parser.parse(input)).toThrowError();
			});
		});
	});

	// todo maybe need to add separate describes for each function type, too much unnecessary work for now though
	describe('Functions are correctly separated into types: string,decimal,integer etc', () => {
		const cases = generateExpressionCases(functionCasesAndExpectedTypes);
		test.each(cases)('%s', (input: string, obj) => {
			const result = parser.parse(input);
			assert.deepOwnInclude(result, obj);
		});
	});

	// todo add dedicated recursion tests
	// need to test limits, should be ~8 levels of nesting, but i think there is actually no limit
});
