import { ModuleNames } from '@yantrix/codegen';
import { builtInFunctions, FunctionDictionary, randomInteger, randomString, TAutomataFunction } from '@yantrix/core';
import { SpecialCharList } from '@yantrix/yantrix-parser';
import { afterEach, assert, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { generateAndSave } from './fixtures/utils.js';

let functionDictionaryTestFixture: FunctionDictionary;

const { add, mult, pow, sumsq, substr, and, contains, isGreater } = builtInFunctions;

const testFunctionsExamples = [
	(x: number, y: number) => add(pow(x, 2), pow(y, 2)),
	(str: string) => substr(str, 1, 5),
	(arr: number[]) => mult(sumsq(...arr), 10),
	(obj: { property: number }) => and(contains(obj, 'property'), isGreater(obj.property, 10)),
] as TAutomataFunction[];

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

describe('jS/TS Function Dictionary', async () => {
	await generateAndSave({ input, automataName: 'FunctionDictionaryTest', lang: ModuleNames.JavaScript }, 'functions');

	const res = await import(`./fixtures/generated/functions_generated.js`);

	const automata = new res.FunctionDictionaryTest();
	const functionDictionary = automata.getFunctionRegistry();

	if (!functionDictionary) {
		throw new Error('Function Dictionary not found');
	}

	beforeAll(() => {
		functionDictionaryTestFixture = new FunctionDictionary();
	});

	beforeEach(() => {
		functionDictionaryTestFixture.register(builtInFunctions);
	});

	afterEach(() => {
		functionDictionaryTestFixture.clear();
	});

	it('dictionary is not empty and has built-in functions inside upon creation', () => {
		assert.isNotNull(functionDictionary);
		assert.deepOwnInclude(functionDictionary, functionDictionaryTestFixture);
	});

	describe('can get functions from a dictionary', () => {
		it('built-in functions', () => {
			Object.keys(builtInFunctions).forEach((key) => {
				const expected = builtInFunctions[key as keyof typeof builtInFunctions];
				const func = functionDictionary.get(key);
				expect(func).toEqual(expected);
			});
		});
		it('custom functions', () => {
			testFunctionsExamples.forEach((f) => {
				const key = randomString(20);
				functionDictionary.register(key, f);
				expect(functionDictionary.get(key)).toEqual(f);
			});
		});
	});

	it('cannot get a function under a non-existing key', () => {
		for (let i = 0; i < 20; i++) {
			const randomKey = randomString(20);
			expect(() => functionDictionary.get(randomKey)).toThrowError();
		}
	});

	it('can register custom functions inside of a dictionary', () => {
		testFunctionsExamples.forEach((f) => {
			const functionName = randomString();
			functionDictionary.register(functionName, f);
			expect(functionDictionary.get(functionName)).toEqual(f);
		});
	});

	it('custom functions return the same result before and after being added to a dictionary', () => {
		const customFunction = (x: number) => add(mult(x, 2), pow(x, 3));
		for (let i = 0; i < 20; i++) {
			const num = randomInteger(1, 15);
			const expectedResult = customFunction(num);

			const customKey = randomString(10);

			functionDictionary.register(customKey, customFunction);
			const func = functionDictionary.get(customKey);

			if (!func) return;

			expect(func(num)).toEqual(expectedResult);
		}
	});

	it('cannot register a function with incorrect key length', () => {
		for (let i = 0; i < 20; i++) {
			const invalidKey = randomString(randomInteger(256, 1000));
			expect(() => functionDictionary.register(invalidKey, testFunctionsExamples[0] ?? null)).toThrowError();
		}
	});

	it('cannot register a function with incorrect key format', () => {
		const customFunction = testFunctionsExamples[0] ?? null;
		invalidFunctionNamesTemplates.forEach((temp) => {
			const invalidName = createNameFromTemplate(temp);
			expect(() => functionDictionary.register(invalidName, customFunction)).toThrowError();
		});
	});

	describe('cannot register a function under an already existing key', () => {
		it('built-in keys', () => {
			Object.keys(builtInFunctions).forEach((key) => {
				expect(() => functionDictionary.register(key, testFunctionsExamples[0] ?? null)).toThrowError();
			});
		});
		it('custom key', () => {
			for (let i = 0; i < 20; i++) {
				const customKey = randomString(10);
				functionDictionary.register(customKey, testFunctionsExamples[0] ?? null);
				expect(() => functionDictionary.register(customKey, testFunctionsExamples[0] ?? null)).toThrowError();
			}
		});
	});

	// describe('generated Automata Function Registry Replacement', async () => {
	// 	let fixture;

	// 	beforeEach(() => {
	// 		fixture = Object.assign({}, FunctionDictionary.getInstance());
	// 	});

	// 	it('can replace registry in an automata', () => {
	// 		fixture.id = 'replaced_id';
	// 		automata.setFunctionRegistry(fixture);
	// 		const id = automata.getFunctionRegistry().id;
	// 		expect(id).toBeDefined();
	// 		expect(id).toEqual('replaced_id');
	// 	});

	// 	// todo add more tests
	// });
});
