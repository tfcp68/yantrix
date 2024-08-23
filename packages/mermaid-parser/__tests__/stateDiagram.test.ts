import { describe, expect, it } from 'vitest';
import { createStateDiagram, parseStateDiagram } from '../src/index.js';
import {
	blankDiagram,
	emptyStateDiagram,
	invalidDiagram,
	stateDiagramDoublePath,
	stateDiagramSimpleTransition,
	stateDiagramSimpleTransitionCompleted,
	stateDiagramSimpleTransitionWithComments,
	stateDiagramWithChoiceAndNote,
	stateDiagramWithLeftSideNote,
	stateDiagramWithLoopChoice,
	stateDiagramWithNamedStates,
	stateDiagramWithRightSideNote,
	stateDiagramWithSameAction,
	stateDiagramWithSimpleChoice,
	stateDiagramWithSimpleFork,
} from './fixtures/diagramPatterns.js';

import {
	emptyStateDiagramExpectedResult,
	simpleTransitionCompletedExpectedResult,
	simpleTransitionExpectedResult,
	simpleTransitionWithCommentsExpectedResult,
	stateDiagramDoublePathExpectedResult,
	stateDiagramWithChoiceAndNoteExpectedResult,
	stateDiagramWithChoiceExpectedResult,
	stateDiagramWithForkExpectedResult,
	stateDiagramWithLeftSideNoteExpectedResult,
	stateDiagramWithLoopConditionExpectedResultString,
	stateDiagramWithNamedStatesExpectedResult,
	stateDiagramWithRightSideNoteExpectedResult,
	stateDiagramWithSameActionExpectedResult,
} from './fixtures/stateDiagramExpectedResults.js';

describe('state Diagram Parser', () => {
	describe('common', () => {
		it('blankInput', async () => {
			const diagramText = blankDiagram;
			await expect(parseStateDiagram(diagramText)).rejects.toThrowError();
		});
		it('invalidDiagram', async () => {
			const diagramText = invalidDiagram;
			await expect(parseStateDiagram(diagramText)).rejects.toThrowError();
		});
		it('emptyStateDiagram', async () => {
			const diagramText = emptyStateDiagram;
			const parsedDiagram = await parseStateDiagram(diagramText);
			const stateDiagram = await createStateDiagram(parsedDiagram);
			const expectedResult = emptyStateDiagramExpectedResult;
			expect(JSON.stringify(stateDiagram)).toEqual(JSON.stringify(expectedResult));
		});
		it('simpleTransition', async () => {
			const diagramText = stateDiagramSimpleTransition;
			const parsedDiagram = await parseStateDiagram(diagramText);
			const stateDiagram = await createStateDiagram(parsedDiagram);
			const expectedResult = simpleTransitionExpectedResult;
			expect(JSON.stringify(stateDiagram)).toEqual(JSON.stringify(expectedResult));
		});
		it('simpleTransitionCompleted', async () => {
			const diagramText = stateDiagramSimpleTransitionCompleted;
			const parsedDiagram = await parseStateDiagram(diagramText);
			const stateDiagram = await createStateDiagram(parsedDiagram);
			const expectedResult = simpleTransitionCompletedExpectedResult;
			expect(JSON.stringify(stateDiagram)).toEqual(JSON.stringify(expectedResult));
		});
		it('simpleTransitionWithComments', async () => {
			const diagramText = stateDiagramSimpleTransitionWithComments;
			const parsedDiagram = await parseStateDiagram(diagramText);
			const stateDiagram = await createStateDiagram(parsedDiagram);
			const expectedResult = simpleTransitionWithCommentsExpectedResult;
			expect(JSON.stringify(stateDiagram)).toEqual(JSON.stringify(expectedResult));
		});
		it('stateDiagramWithChoice', async () => {
			const diagramText = stateDiagramWithSimpleChoice;
			const parsedDiagram = await parseStateDiagram(diagramText);
			const stateDiagram = await createStateDiagram(parsedDiagram);
			const expectedResult = stateDiagramWithChoiceExpectedResult;
			expect(JSON.stringify(stateDiagram)).toEqual(JSON.stringify(expectedResult));
		});
		it('stateDiagramWithFork', async () => {
			// forks doesnt supported right now
			const diagramText = stateDiagramWithSimpleFork;
			const parsedDiagram = await parseStateDiagram(diagramText);
			const stateDiagram = await createStateDiagram(parsedDiagram);
			const expectedResult = stateDiagramWithForkExpectedResult;
			expect(JSON.stringify(stateDiagram)).toEqual(JSON.stringify(expectedResult));
		});
		it('stateDiagramWithLoopCondition', async () => {
			const diagramText = stateDiagramWithLoopChoice;
			const parsedDiagram = await parseStateDiagram(diagramText);
			const expectedResult = stateDiagramWithLoopConditionExpectedResultString;
			await expect(createStateDiagram(parsedDiagram)).rejects.toThrowError(expectedResult);
		});
		it('stateDiagramWithLeftSideNote', async () => {
			const diagramText = stateDiagramWithLeftSideNote;
			const parsedDiagram = await parseStateDiagram(diagramText);
			const stateDiagram = await createStateDiagram(parsedDiagram);
			const expectedResult = stateDiagramWithLeftSideNoteExpectedResult;
			expect(JSON.stringify(stateDiagram)).toEqual(JSON.stringify(expectedResult));
		});
		it('stateDiagramWithRightSideNote', async () => {
			const diagramText = stateDiagramWithRightSideNote;
			const parsedDiagram = await parseStateDiagram(diagramText);
			const stateDiagram = await createStateDiagram(parsedDiagram);
			const expectedResult = stateDiagramWithRightSideNoteExpectedResult;
			expect(JSON.stringify(stateDiagram)).toEqual(JSON.stringify(expectedResult));
		});
		it('stateDiagramWithChoiceAndNote', async () => {
			const diagramText = stateDiagramWithChoiceAndNote;
			const parsedDiagram = await parseStateDiagram(diagramText);
			const stateDiagram = await createStateDiagram(parsedDiagram);
			const expectedResult = stateDiagramWithChoiceAndNoteExpectedResult;
			expect(JSON.stringify(stateDiagram)).toEqual(JSON.stringify(expectedResult));
		});
		it('stateDiagramWithSameAction', async () => {
			const diagramText = stateDiagramWithSameAction;
			const parsedDiagram = await parseStateDiagram(diagramText);
			const stateDiagram = await createStateDiagram(parsedDiagram);
			const expectedResult = stateDiagramWithSameActionExpectedResult;
			expect(JSON.stringify(stateDiagram)).toEqual(JSON.stringify(expectedResult));
		});
		it('stateDiagramWithNamedStates', async () => {
			const diagramText = stateDiagramWithNamedStates;
			const parsedDiagram = await parseStateDiagram(diagramText);
			const stateDiagram = await createStateDiagram(parsedDiagram);
			const expectedResult = stateDiagramWithNamedStatesExpectedResult;
			expect(JSON.stringify(stateDiagram)).toEqual(JSON.stringify(expectedResult));
		});
		it('stateDiagramDoublePath', async () => {
			const diagramText = stateDiagramDoublePath;
			const parsedDiagram = await parseStateDiagram(diagramText);
			const stateDiagram = await createStateDiagram(parsedDiagram);
			const expectedResult = stateDiagramDoublePathExpectedResult;
			expect(JSON.stringify(stateDiagram)).toEqual(JSON.stringify(expectedResult));
		});
	});
});
