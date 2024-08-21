import { assert, beforeEach, describe, expect, test } from 'vitest';
import { randomString, randomInteger } from '@yantrix/utils';
import { SpecialCharList } from '@yantrix/yantrix-parser';
import { FunctionDictionary, AutomataFunction } from '@yantrix/automata';
import { builtInFunctions } from '@yantrix/codegen';
import { saveAndGenerate } from './fixtures/utils.js';

let functionDictionaryFixture: FunctionDictionary;

const { add, mult, pow, sumsq, substr, and, contains, isGreater } = builtInFunctions;
const testFunctionsExamples = [
	(x: number, y: number) => add(pow(x, 2), pow(y, 2)),
	(str: string) => substr(str, 1, 5),
	(arr: number[]) => mult(sumsq(...arr), 10),
	(obj: { property: number }) => and(contains(obj, 'property'), isGreater(obj['property'], 10)),
] as AutomataFunction[];

const invalidFunctionNamesTemplates = [
	...SpecialCharList,
	...SpecialCharList.map((char: string) => `${char}%s`),
	'%s %s',
	'%d%s',
	'%d',
	'',
];

const input = `stateDiagram-v2
            [*] --> A`;

const createNameFromTemplate = (str: string) =>
	str.replaceAll('%s', randomString()).replaceAll('%d', randomInteger(0, 9).toString());

describe('JS/TS Function Dictionary', async () => {
	await saveAndGenerate({ input, automataName: 'FunctionDictionaryTest', lang: 'JavaScript' }, 'functions');

	const res = await import(`./fixtures/generated/functions_generated.js`);

	const functionDictionary = res.functionDictionary;

	beforeEach(() => {
		functionDictionaryFixture = new FunctionDictionary(builtInFunctions);
	});

	test('Dictionary is not empty and has built-in functions inside upon creation', () => {
		assert.isNotNull(functionDictionary);
		assert.deepOwnInclude(functionDictionary, functionDictionaryFixture);
	});

	describe('Can get functions from a dictionary', () => {
		test('Built-in functions', () => {
			Object.keys(builtInFunctions).forEach((key) => {
				const expected = builtInFunctions[key as keyof typeof builtInFunctions];
				const func = functionDictionary.get(key);
				expect(func).toEqual(expected);
			});
		});
		test('Custom functions', () => {
			testFunctionsExamples.forEach((f) => {
				const key = randomString(20);
				functionDictionary.register(key, f);
				expect(functionDictionary.get(key)).toEqual(f);
			});
		});
	});

	test('Cannot get a function under a non-existing key', () => {
		for (let i = 0; i < 20; i++) {
			const randomKey = randomString(20);
			expect(() => functionDictionary.get(randomKey)).toThrowError();
		}
	});

	test('Can register custom functions inside of a dictionary', () => {
		testFunctionsExamples.forEach((f) => {
			const functionName = randomString();
			functionDictionary.register(functionName, f);
			expect(functionDictionary.get(functionName)).toEqual(f);
		});
	});

	test('Custom functions return the same result before and after being added to a dictionary', () => {
		const customFunction = (x: number) => add(mult(x, 2), pow(x, 3));
		for (let i = 0; i < 20; i++) {
			const num = randomInteger(1, 15);
			const expectedResult = customFunction(num);

			const customKey = randomString(10);

			const functionFromDictionary = functionDictionary.register(customKey, customFunction)!;
			expect(functionFromDictionary(num)).toEqual(expectedResult);
		}
	});

	test('Cannot register a function with incorrect key length', () => {
		for (let i = 0; i < 20; i++) {
			const invalidKey = randomString(randomInteger(256, 1000));
			expect(() => functionDictionary.register(invalidKey, testFunctionsExamples[0] ?? null)).toThrowError();
		}
	});

	test('Cannot register a function with incorrect key format', () => {
		const customFunction = testFunctionsExamples[0] ?? null;
		invalidFunctionNamesTemplates.forEach((temp) => {
			const invalidName = createNameFromTemplate(temp);
			expect(() => functionDictionary.register(invalidName, customFunction)).toThrowError();
		});
	});

	describe('Cannot register a function under an already existing key', () => {
		test('Built-in keys', () => {
			Object.keys(builtInFunctions).forEach((key) => {
				expect(() => functionDictionary.register(key, testFunctionsExamples[0] ?? null)).toThrowError();
			});
		});
		test('Custom key', () => {
			for (let i = 0; i < 20; i++) {
				const customKey = randomString(10);
				functionDictionary.register(customKey, testFunctionsExamples[0] ?? null);
				expect(() => functionDictionary.register(customKey, testFunctionsExamples[0] ?? null)).toThrowError();
			}
		});
	});
});
