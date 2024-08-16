import {
	actionsDictionary,
	GamePhaseAutomata,
	functionDictionary,
	statesDictionary,
} from './fixtures/GamePhaseAutomata_generated.js';
import { assert, beforeAll, beforeEach, describe, expect, test, vitest } from 'vitest';
import { randomString } from '@yantrix/utils';
import { FunctionDictionary } from '@yantrix/automata';
import { built_in_functions } from '@yantrix/codegen';

let automata: GamePhaseAutomata;

let functionDictionaryFixture: FunctionDictionary;

describe('JS/TS Function Dictionary', () => {
	beforeEach(() => {
		automata = new GamePhaseAutomata();
		functionDictionaryFixture = new FunctionDictionary(built_in_functions);
	});

	test('Dictionary is not empty and has built-in functions inside', () => {
		assert.isNotNull(functionDictionary);
		assert.deepEqual(functionDictionary, functionDictionaryFixture);
	});

	describe('Can get built-in functions from a dictionary', () => {
		Object.keys(built_in_functions).forEach((key) => {
			test(`Built-in function: ${key}`, () => {
				const expected = built_in_functions[key];
				const func = functionDictionary.getFunction(key);
				assert.equal(func, expected);
			});
		});
	});

	test('Can register new functions inside of a dictionary', () => {
		const functionName = randomString();
		functionDictionary.register(functionName, () => {});
		expect(functionDictionary.getFunction(functionName)).toBeTruthy();
	});
});
