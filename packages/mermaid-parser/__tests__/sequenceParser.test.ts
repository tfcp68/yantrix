import { describe, expect, test } from 'vitest';
import { parseSequenceDiagram } from '../src/index.js';
import { BlankInputError, InvalidInputError } from '../src/sequence/errors/sequenceErrors.js';
import {
	blankDiagram,
	invalidDiagram,
	emptySequenceDiagram,
	sequenceDiagramSimpleMessage,
	sequenceDiagramLoopMessage,
	sequenceDiagramDifferentArrowMessages,
	sequenceDiagramActors,
	sequenceDiagramSimpleActivations,
	sequenceDiagramComplexActivations,
	sequenceDiagramDoubleActorActivations,
	sequenceDiagramSideNote,
	sequenceDiagramSpanningNote,
	sequenceDiagramThreeActorsActivations,
} from './fixtures/sequencePatterns.js';

import {
	emptySequenceDiagramExpectedResult,
	sequenceDiagramSimpleMessageExpectedResult,
	sequenceDiagramLoopMessageExpectedResult,
	sequenceDiagramDifferentArrowMessagesExpectedResult,
	sequenceDiagramActorsExpectedResult,
	sequenceDiagramSimpleActivationsExpectedResult,
	sequenceDiagramComplexActivationsExpectedResult,
	sequenceDiagramDoubleActorActivationsExpectedResult,
	sequenceDiagramSideNoteExpectedResult,
	sequenceDiagramSpanningNoteExpectedResult,
	sequenceDiagramThreeActorsActivationsExpectedResult,
} from './fixtures/sequenceParserExpectedResult.js';

describe('Sequence Diagram Parser', () => {
	describe('Common', () => {
		test('Empty Input Error', async () => {
			await expect(parseSequenceDiagram(blankDiagram)).rejects.toThrow(BlankInputError);
		});

		test('Invalid Diagram Type', async () => {
			await expect(parseSequenceDiagram(invalidDiagram)).rejects.toThrow(InvalidInputError);
		});

		test('Empty Diagram', async () => {
			const parsedDiagram = await parseSequenceDiagram(emptySequenceDiagram);
			const expectedResult = emptySequenceDiagramExpectedResult;
			expect(JSON.stringify(parsedDiagram)).toEqual(JSON.stringify(expectedResult));
		});
	});

	describe('Actors', () => {
		test('Actors and participants', async () => {
			const parsedDiagram = await parseSequenceDiagram(sequenceDiagramActors);
			const expectedResult = sequenceDiagramActorsExpectedResult;
			expect(JSON.stringify(parsedDiagram)).toEqual(JSON.stringify(expectedResult));
		});
	});
	describe('Notes', () => {
		test('Side note', async () => {
			const parsedDiagram = await parseSequenceDiagram(sequenceDiagramSideNote);
			const expectedResult = sequenceDiagramSideNoteExpectedResult;
			expect(JSON.stringify(parsedDiagram)).toEqual(JSON.stringify(expectedResult));
		});

		test('Spanning note', async () => {
			const parsedDiagram = await parseSequenceDiagram(sequenceDiagramSpanningNote);
			const expectedResult = sequenceDiagramSpanningNoteExpectedResult;
			expect(JSON.stringify(parsedDiagram)).toEqual(JSON.stringify(expectedResult));
		});
	});
	describe('Messages', () => {
		test('Simple message', async () => {
			const parsedDiagram = await parseSequenceDiagram(sequenceDiagramSimpleMessage);
			const expectedResult = sequenceDiagramSimpleMessageExpectedResult;
			expect(JSON.stringify(parsedDiagram)).toEqual(JSON.stringify(expectedResult));
		});

		test('Loop message', async () => {
			const parsedDiagram = await parseSequenceDiagram(sequenceDiagramLoopMessage);
			const expectedResult = sequenceDiagramLoopMessageExpectedResult;
			expect(JSON.stringify(parsedDiagram)).toEqual(JSON.stringify(expectedResult));
		});

		test('Different arrow messages', async () => {
			const parsedDiagram = await parseSequenceDiagram(sequenceDiagramDifferentArrowMessages);
			const expectedResult = sequenceDiagramDifferentArrowMessagesExpectedResult;
			expect(JSON.stringify(parsedDiagram)).toEqual(JSON.stringify(expectedResult));
		});
	});
	describe('Activations', () => {
		test('Simple activations', async () => {
			const parsedDiagram = await parseSequenceDiagram(sequenceDiagramSimpleActivations);
			const expectedResult = sequenceDiagramSimpleActivationsExpectedResult;
			expect(JSON.stringify(parsedDiagram)).toEqual(JSON.stringify(expectedResult));
		});

		test('Complex activations', async () => {
			const parsedDiagram = await parseSequenceDiagram(sequenceDiagramComplexActivations);
			const expectedResult = sequenceDiagramComplexActivationsExpectedResult;
			expect(JSON.stringify(parsedDiagram)).toEqual(JSON.stringify(expectedResult));
		});

		test('Double actor activations', async () => {
			const parsedDiagram = await parseSequenceDiagram(sequenceDiagramDoubleActorActivations);
			const expectedResult = sequenceDiagramDoubleActorActivationsExpectedResult;
			expect(JSON.stringify(parsedDiagram)).toEqual(JSON.stringify(expectedResult));
		});

		test('Three actors activations', async () => {
			const parsedDiagram = await parseSequenceDiagram(sequenceDiagramThreeActorsActivations);
			const expectedResult = sequenceDiagramThreeActorsActivationsExpectedResult;
			expect(JSON.stringify(parsedDiagram)).toEqual(JSON.stringify(expectedResult));
		});
	});
});
