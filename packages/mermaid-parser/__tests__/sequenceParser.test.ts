import { describe, expect, it } from 'vitest';
import { parseSequenceDiagram } from '../src/index.js';
import {
	BlankInputError,
	InvalidInputError,
} from '../src/sequence/errors/sequenceErrors.js';
import { testCases, TTestCase } from './fixtures/sequencePatterns.js';

function groupTestCases(
	testCases: TTestCase[],
): Record<string, TTestCase[]> {
	const groups: Record<string, TTestCase[]> = {};

	for (const testCase of testCases) {
		if (!groups[testCase.testBehaviour]) {
			groups[testCase.testBehaviour] = [];
		}
		groups[testCase.testBehaviour]!.push(testCase);
	}
	return groups;
}

const runTestGroup = (
	testBehaviour: string,
	testCases: TTestCase[],
) => {
	describe(testBehaviour, () => {
		testCases.forEach(({
			testCase,
			inputDiagram,
			expectedResult,

		}) => {
			it(testCase, async () => {
				if (expectedResult instanceof InvalidInputError) {
					await expect(
						parseSequenceDiagram(inputDiagram),
					).rejects.toThrow(InvalidInputError);
				} else if (expectedResult instanceof BlankInputError) {
					await expect(
						parseSequenceDiagram(inputDiagram),
					).rejects.toThrow(BlankInputError);
				} else {
					const parsedDiagram = await parseSequenceDiagram(
						inputDiagram,
					);
					expect(JSON.stringify(parsedDiagram),
					).toEqual(JSON.stringify(expectedResult));
				}
			});
		});
	});
};

function runTests() {
	const groupedTestCases = groupTestCases(testCases);
	for (const testBehaviour of Object.keys(groupedTestCases)) {
		runTestGroup(testBehaviour, groupedTestCases[testBehaviour]!);
	}
}

runTests();
