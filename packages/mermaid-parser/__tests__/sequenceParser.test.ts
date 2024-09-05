import { describe, expect, test } from 'vitest';
import { parseSequenceDiagram } from '../src/index.js';
import { testCases, TTestCase } from './fixtures/sequencePatterns.js';
import { InvalidInputError, BlankInputError } from '../src/sequence/errors/sequenceErrors.js';

function groupTestCases(testCases: TTestCase[]): Record<string, TTestCase[]> {
	const groups: Record<string, TTestCase[]> = {};

	for (const testCase of testCases) {
		if (!groups[testCase.groupName]) {
			groups[testCase.groupName] = [];
		}
		groups[testCase.groupName]!.push(testCase);
	}

	return groups;
}

const runTestGroup = (groupName: string, testCases: TTestCase[]) => {
	describe(groupName, () => {
		testCases.forEach(({ testName, input, expected }) => {
			test(testName, async () => {
				if (expected instanceof InvalidInputError) {
					await expect(parseSequenceDiagram(input)).rejects.toThrow(InvalidInputError);
				} else if (expected instanceof BlankInputError) {
					await expect(parseSequenceDiagram(input)).rejects.toThrow(BlankInputError);
				} else {
					const parsedDiagram = await parseSequenceDiagram(input);
					expect(JSON.stringify(parsedDiagram)).toEqual(JSON.stringify(expected));
				}
			});
		});
	});
};

function runTests() {
	const groupedTestCases = groupTestCases(testCases);
	for (const groupName of Object.keys(groupedTestCases)) {
		runTestGroup(groupName, groupedTestCases[groupName]!);
	}
}

runTests();
