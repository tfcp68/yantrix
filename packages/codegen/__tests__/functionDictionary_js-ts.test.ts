import {
	actionsDictionary,
	GamePhaseAutomata,
	functionDictionary,
	statesDictionary,
} from './fixtures/GamePhaseAutomata_generated.js';
import { assert, beforeAll, beforeEach, describe, expect, test, vitest } from 'vitest';
import { randomString, randomInteger } from '@yantrix/utils';
import { SpecialCharList } from '@yantrix/yantrix-parser';
import { FunctionDictionary } from '@yantrix/automata';
import { builtInFunctions } from '@yantrix/codegen';

let automata: GamePhaseAutomata;

let functionDictionaryFixture: FunctionDictionary;

const { add, mult, pow, sum, sumSq, substr, and, contains, isGreater } = builtInFunctions;
const testFunctionsExamples = [
	(x: number, y: number) => add(pow(x, 2), pow(y, 2)),
	(str: string) => substr(str, 1, 5),
	(arr: number[]) => mult(sumSq(arr), 10),
	(obj: object) => and(contains(obj, 'property'), isGreater(obj['property'], 10)),
];

const invalidFunctionNamesTemplates = [
	...SpecialCharList,
	...SpecialCharList.map((char) => `${char}%s`),
	'%s %s',
	'%d%s',
	'%d',
	'',
];
const createNameFromTemplate = (str) => str.replaceAll('%s', randomString()).replaceAll('%d', randomInteger(0, 9));

describe('JS/TS Function Dictionary', () => {
	beforeEach(() => {
		automata = new GamePhaseAutomata();
		functionDictionaryFixture = new FunctionDictionary(builtInFunctions);
	});

	test('Dictionary is not empty and has built-in functions inside upon creation', () => {
		assert.isNotNull(functionDictionary);
		assert.deepEqual(functionDictionary, functionDictionaryFixture);
	});

	describe('Can get functions from a dictionary', () => {
		describe('Built-in functions', () => {
			Object.keys(builtInFunctions).forEach((key) => {
				test(`Built-in function: ${key}`, () => {
					const expected = builtInFunctions[key];
					const func = functionDictionary.get(key);
					assert.equal(func, expected);
				});
			});
		});
		describe('Custom functions', () => {
			for (let i = 0; i < 20; i++) {
				const key = randomString(20);
				test(`${key}`, () => {
					functionDictionary.register(key, (x) => x * 2);
					expect(functionDictionary.get(key)).toBeTruthy();
				});
			}
		});
	});

	describe('Cannot get a function under a non-existing key', () => {
		for (let i = 0; i < 20; i++) {
			const randomKey = randomString(20);
			test(`${randomKey}`, () => {
				expect(() => functionDictionary.get(randomKey)).toThrowError();
			});
		}
	});

	describe('Can register custom functions inside of a dictionary', () => {
		testFunctionsExamples.forEach((f) => {
			const functionName = randomString();
			test(`${functionName}: ${f}`, () => {
				functionDictionary.register(functionName, f);
				expect(functionDictionary.get(functionName)).toEqual(f);
			});
		});
	});

	describe('Custom functions return the same result before and after being added to a dictionary', () => {
		const customFunction = (x: number) => add(mult(x, 2), pow(x, 3));
		for (let i = 0; i < 20; i++) {
			const num = randomInteger(1, 15);
			const expectedResult = customFunction(num);

			const customKey = randomString(10);
			functionDictionary.register(customKey, customFunction);

			test(`${customFunction}, expected result ${expectedResult}`, () => {
				const functionFromDictionary = functionDictionary.get(customKey);
				expect(functionFromDictionary(num)).toEqual(expectedResult);
			});
		}
	});

	describe('Cannot register a function with incorrect key length', () => {
		for (let i = 0; i < 20; i++) {
			const invalidKey = randomString(randomInteger(256, 1000));
			test(`${invalidKey} - ERROR`, () => {
				expect(() => functionDictionary.register(invalidKey, (x) => x * 2)).toThrowError();
			});
		}
	});

	describe('Cannot register a function with incorrect format', () => {
		const customFunction = testFunctionsExamples[0];
		invalidFunctionNamesTemplates.forEach((temp) => {
			const invalidName = createNameFromTemplate(temp);
			test(`${invalidName}`, () => {
				expect(() => functionDictionary.register(invalidName, customFunction)).toThrowError();
			});
		});
	});

	describe('Cannot register a function under an already existing key', () => {
		describe('Built-in keys', () => {
			Object.keys(builtInFunctions).forEach((key) => {
				test(`${key}`, () => {
					expect(() => functionDictionary.register(key, (x) => null)).toThrowError();
				});
			});
		});
		describe('Custom key', () => {
			for (let i = 0; i < 20; i++) {
				const customKey = randomString(10);
				test(`${customKey}`, () => {
					functionDictionary.register(customKey, (x) => x * 2);
					expect(() => functionDictionary.register(customKey, (x) => null)).toThrowError();
				});
			}
		});
	});
});
