import { describe, expect, test } from 'vitest';
import { parseStateDiagram, createStateDiagram } from '../src/index.js';
import {
	blankInput,
	invalidDiagram,
	emptyStateDiagram,
	simpleTransition,
	simpleTransitionCompleted,
	simpleTransitionWithComments,
	stateDiagramWithChoice,
	stateDiagramWithFork,
	stateDiagramWithLoopCondition,
	stateDiagramWithLeftSideNote,
	stateDiagramWithRightSideNote,
	stateDiagramWithChoiceAndNote,
	stateDiagramWithSameAction,
	stateDiagramWithNamedStates,
	stateDiagramDoublePath,
} from './fixtures/diagramPatterns.js';

import {
	emptyStateDiagramExpectedResultString,
	simpleTransitionExpectedResultString,
	simpleTransitionCompletedExpectedResultString,
	simpleTransitionWithCommentsExpectedResultString,
	stateDiagramWithChoiceExpectedResultString,
	stateDiagramWithForkExpectedResultString,
	stateDiagramWithLeftSideNoteExpectedResultString,
	stateDiagramWithRightSideNoteExpectedResultString,
	stateDiagramWithChoiceAndNoteExpectedResultString,
	stateDiagramWithSameActionExpectedResultString,
	stateDiagramWithNamedStatesExpectedResultString,
	stateDiagramDoublePathExpectedResultString,
} from './fixtures/stateDiagramExpectedResults.js';

describe('State Diagram Parser', () => {
	describe('Common', () => {
		test('blankInput', async () => {
			const diagramText = blankInput;
			await expect(parseStateDiagram(diagramText)).rejects.toThrowError();
		});
		test('invalidDiagram', async () => {
			const diagramText = invalidDiagram;
			await expect(parseStateDiagram(diagramText)).rejects.toThrowError();
		});
		test('emptyStateDiagram', async () => {
			const diagramText = emptyStateDiagram;
			const parsedDiagram = await parseStateDiagram(diagramText);
			const stateDiagram = await createStateDiagram(parsedDiagram);
			const expectedResult = emptyStateDiagramExpectedResultString;
			expect(JSON.stringify(stateDiagram)).toEqual(expectedResult);
		});
		test('simpleTransition', async () => {
			const diagramText = simpleTransition;
			const parsedDiagram = await parseStateDiagram(diagramText);
			const stateDiagram = await createStateDiagram(parsedDiagram);
			const expectedResult = simpleTransitionExpectedResultString;
			expect(JSON.stringify(stateDiagram)).toEqual(expectedResult);
		});
		test('simpleTransitionCompleted', async () => {
			const diagramText = simpleTransitionCompleted;
			const parsedDiagram = await parseStateDiagram(diagramText);
			const stateDiagram = await createStateDiagram(parsedDiagram);
			const expectedResult =
				simpleTransitionCompletedExpectedResultString;
			expect(JSON.stringify(stateDiagram)).toEqual(expectedResult);
		});
		test('simpleTransitionWithComments', async () => {
			const diagramText = simpleTransitionWithComments;
			const parsedDiagram = await parseStateDiagram(diagramText);
			const stateDiagram = await createStateDiagram(parsedDiagram);
			const expectedResult =
				simpleTransitionWithCommentsExpectedResultString;
			expect(JSON.stringify(stateDiagram)).toEqual(expectedResult);
		});
		test('stateDiagramWithChoice', async () => {
			const diagramText = stateDiagramWithChoice;
			const parsedDiagram = await parseStateDiagram(diagramText);
			const stateDiagram = await createStateDiagram(parsedDiagram);
			const expectedResult = stateDiagramWithChoiceExpectedResultString;
			expect(JSON.stringify(stateDiagram)).toEqual(expectedResult);
		});
		test('stateDiagramWithFork', async () => {
			// forks doesnt supported right now
			const diagramText = stateDiagramWithFork;
			const parsedDiagram = await parseStateDiagram(diagramText);
			const stateDiagram = await createStateDiagram(parsedDiagram);
			const expectedResult = stateDiagramWithForkExpectedResultString;
			expect(JSON.stringify(stateDiagram)).toEqual(expectedResult);
		});
		test('stateDiagramWithLoopCondition', async () => {
			const diagramText = stateDiagramWithLoopCondition;
			const parsedDiagram = await parseStateDiagram(diagramText);
			await expect(
				createStateDiagram(parsedDiagram),
			).rejects.toThrowError(
				'Link to itself from the choice side. D-->D',
			);
		});
		test('stateDiagramWithLeftSideNote', async () => {
			const diagramText = stateDiagramWithLeftSideNote;
			const parsedDiagram = await parseStateDiagram(diagramText);
			const stateDiagram = await createStateDiagram(parsedDiagram);
			const expectedResult =
				stateDiagramWithLeftSideNoteExpectedResultString;
			expect(JSON.stringify(stateDiagram)).toEqual(expectedResult);
		});
		test('stateDiagramWithRightSideNote', async () => {
			const diagramText = stateDiagramWithRightSideNote;
			const parsedDiagram = await parseStateDiagram(diagramText);
			const stateDiagram = await createStateDiagram(parsedDiagram);
			const expectedResult =
				stateDiagramWithRightSideNoteExpectedResultString;
			expect(JSON.stringify(stateDiagram)).toEqual(expectedResult);
		});
		test('stateDiagramWithChoiceAndNote', async () => {
			const diagramText = stateDiagramWithChoiceAndNote;
			const parsedDiagram = await parseStateDiagram(diagramText);
			const stateDiagram = await createStateDiagram(parsedDiagram);
			const expectedResult =
				stateDiagramWithChoiceAndNoteExpectedResultString;
			expect(JSON.stringify(stateDiagram)).toEqual(expectedResult);
		});
		test('stateDiagramWithSameAction', async () => {
			const diagramText = stateDiagramWithSameAction;
			const parsedDiagram = await parseStateDiagram(diagramText);
			const stateDiagram = await createStateDiagram(parsedDiagram);
			const expectedResult =
				stateDiagramWithSameActionExpectedResultString;
			expect(JSON.stringify(stateDiagram)).toEqual(expectedResult);
		});
		test('stateDiagramWithNamedStates', async () => {
			const diagramText = stateDiagramWithNamedStates;
			const parsedDiagram = await parseStateDiagram(diagramText);
			const stateDiagram = await createStateDiagram(parsedDiagram);
			const expectedResult =
				stateDiagramWithNamedStatesExpectedResultString;
			expect(JSON.stringify(stateDiagram)).toEqual(expectedResult);
		});
		test('stateDiagramDoublePath', async () => {
			const diagramText = stateDiagramDoublePath;
			const parsedDiagram = await parseStateDiagram(diagramText);
			const stateDiagram = await createStateDiagram(parsedDiagram);
			const expectedResult = stateDiagramDoublePathExpectedResultString;
			expect(JSON.stringify(stateDiagram)).toEqual(expectedResult);
		});
	});
});
