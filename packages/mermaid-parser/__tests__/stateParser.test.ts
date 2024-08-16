import { describe, expect, test } from 'vitest';
import { parseStateDiagram } from '../src/index.js';
import { BlankInputError, InvalidInputError } from '../src/state/errors/stateErrors.js';
import {
	blankDiagram,
	emptyStateDiagram,
	invalidDiagram,
	stateDiagramAllStatesToEnd,
	stateDiagramDoublePath,
	stateDiagramSimpleTransition,
	stateDiagramSimpleTransitionCompleted,
	stateDiagramSimpleTransitionWithComments,
	stateDiagramWitNormalForks,
	stateDiagramWithDoubleTransitions,
	stateDiagramWithEmptyNote,
	stateDiagramWithLeftSideNote,
	stateDiagramWithLoopChoice,
	stateDiagramWithMultilineNotes,
	stateDiagramWithNamedStates,
	stateDiagramWithOneLineNotes,
	stateDiagramWithRightSideNote,
	stateDiagramWithSimpleChoice,
	stateDiagramWithSimpleFork,
} from './fixtures/diagramPatterns.js';

describe('State Diagram Parser', () => {
	describe('Common', () => {
		test('Empty Input Error', async () => {
			await expect(parseStateDiagram(blankDiagram)).rejects.toThrow(BlankInputError);
		});

		test('Invalid Diagram Type', async () => {
			await expect(parseStateDiagram(invalidDiagram)).rejects.toThrow(InvalidInputError);
		});

		test('Empty Diagram', async () => {
			const parsedDiagram = await parseStateDiagram(emptyStateDiagram);

			expect(parsedDiagram.notes).toEqual([]);
			expect(parsedDiagram.actions).toEqual([]);
			expect(parsedDiagram.states).toEqual([]);
			expect(parsedDiagram.forks).toEqual([]);
			expect(parsedDiagram.choices).toEqual([]);
		});
	});

	describe('Notes', () => {
		test('One Line', async () => {
			const { notes } = await parseStateDiagram(stateDiagramWithOneLineNotes);

			expect(notes.length).toEqual(2);
			expect(notes[0]?.over).toEqual('A');
			expect(notes[1]?.over).toEqual('B');
			expect(notes[0]?.text[0]).toEqual('simple note left of A');
			expect(notes[1]?.text[0]).toEqual('simple note right of B');
		});

		test('Empty Note', async () => {
			const { notes } = await parseStateDiagram(stateDiagramWithEmptyNote);

			expect(notes.length).toEqual(2);
			expect(notes[0]?.over).toEqual('A');
			expect(notes[1]?.over).toEqual('B');
			expect(notes[0]?.text[0]).toEqual('');
			expect(notes[1]?.text[0]).toEqual('');
		});

		test('Left side note', async () => {
			const { notes } = await parseStateDiagram(stateDiagramWithLeftSideNote);

			expect(notes.length).toEqual(1);
			expect(notes[0]?.over).toEqual('A');
			expect(notes[0]?.text[0]).toEqual('simple left side note');
		});

		test('Right side note', async () => {
			const { notes } = await parseStateDiagram(stateDiagramWithRightSideNote);

			expect(notes.length).toEqual(1);

			expect(notes[0]?.over).toEqual('A');

			expect(notes[0]?.text[0]).toEqual('simple right side note');
			expect(notes[0]?.text[1]).toEqual('another simple left side note');
		});

		test('Multiline note', async () => {
			const { notes } = await parseStateDiagram(stateDiagramWithMultilineNotes);

			expect(notes.length).toEqual(1);

			expect(notes[0]?.over).toEqual('A');

			expect(notes[0]?.text[0]).toEqual(
				'simple right side note\n' + 'right of A that is\n' + 'longer than 1 line',
			);
			expect(notes[0]?.text[1]).toEqual('another note left\n' + 'of A that contains\n' + 'more than 1 line');
		});
	});

	describe('States And Actions', () => {
		test('Simple Transition', async () => {
			const parsedDiagram = await parseStateDiagram(stateDiagramSimpleTransition);

			expect(parsedDiagram.states).toEqual([
				{ id: 'A', caption: 'A' },
				{ id: 'B', caption: 'B' },
			]);
			expect(parsedDiagram.actions).toEqual([{ from: 'A', to: 'B', id: 'A, B, 0' }]);
			expect(parsedDiagram.notes).toEqual([]);
			expect(parsedDiagram.choices).toEqual([]);
			expect(parsedDiagram.forks).toEqual([]);
		});

		test('Named State', async () => {
			const parsedDiagram = await parseStateDiagram(stateDiagramWithNamedStates);

			expect(parsedDiagram.states).toEqual([
				{ id: '~~~START~~~', caption: '~~~START~~~' },
				{ id: 'A', caption: 'Lesha' },
				{ id: 'B', caption: 'B' },
				{ id: '~~~END~~~', caption: '~~~END~~~' },
			]);
			expect(parsedDiagram.actions).toEqual([
				{ from: '~~~START~~~', to: 'A', id: '~~~START~~~, A, 0' },
				{ from: 'A', to: 'B', id: 'A, B, 1' },
				{ from: 'B', to: '~~~END~~~', id: 'B, ~~~END~~~, 2' },
			]);
			expect(parsedDiagram.notes).toEqual([]);
			expect(parsedDiagram.choices).toEqual([]);
			expect(parsedDiagram.forks).toEqual([]);
		});

		test('Simple Completed Transition', async () => {
			const parsedDiagram = await parseStateDiagram(stateDiagramSimpleTransitionCompleted);

			expect(parsedDiagram.states).toEqual([
				{ id: '~~~START~~~', caption: '~~~START~~~' },
				{ id: 'A', caption: 'A' },
				{ id: 'B', caption: 'B' },
				{ id: '~~~END~~~', caption: '~~~END~~~' },
			]);
			expect(parsedDiagram.actions).toEqual([
				{ from: '~~~START~~~', to: 'A', id: '~~~START~~~, A, 0' },
				{ from: 'A', to: 'B', id: 'A, B, 1' },
				{ from: 'B', to: '~~~END~~~', id: 'B, ~~~END~~~, 2' },
			]);
			expect(parsedDiagram.notes).toEqual([]);
			expect(parsedDiagram.choices).toEqual([]);
			expect(parsedDiagram.forks).toEqual([]);
		});

		test('Simple Transition With Comments', async () => {
			const parsedDiagram = await parseStateDiagram(stateDiagramSimpleTransitionWithComments);

			expect(parsedDiagram.states).toEqual([
				{ id: '~~~START~~~', caption: '~~~START~~~' },
				{ id: 'A', caption: 'A' },
				{ id: 'B', caption: 'B' },
				{ id: '~~~END~~~', caption: '~~~END~~~' },
			]);
			expect(parsedDiagram.actions).toEqual([
				{ from: '~~~START~~~', to: 'A', id: 'Start' },
				{ from: 'A', to: 'B', id: 'Transition 1' },
				{ from: 'B', to: '~~~END~~~', id: 'End' },
			]);
			expect(parsedDiagram.notes).toEqual([]);
			expect(parsedDiagram.choices).toEqual([]);
			expect(parsedDiagram.forks).toEqual([]);
		});

		test('All States To End', async () => {
			const result = await parseStateDiagram(stateDiagramAllStatesToEnd);

			expect(result.states).toEqual([
				{ id: '~~~START~~~', caption: '~~~START~~~' },
				{ id: 'A', caption: 'A' },
				{ id: 'B', caption: 'B' },
				{ id: '~~~END~~~', caption: '~~~END~~~' },
			]);

			expect(result.actions).toEqual([
				{
					from: '~~~START~~~',
					to: 'A',
					id: '~~~START~~~, A, 0',
				},
				{ from: 'A', to: 'B', id: 'A, B, 1' },
				{ from: 'A', to: '~~~END~~~', id: 'A, ~~~END~~~, 2' },
				{ from: 'B', to: '~~~END~~~', id: 'B, ~~~END~~~, 3' },
				{
					from: '~~~START~~~',
					to: '~~~END~~~',
					id: '~~~START~~~',
				},
			]);
		});

		test('Double Transitions', async () => {
			const result = await parseStateDiagram(stateDiagramWithDoubleTransitions);

			expect(result.actions).toEqual([
				{
					from: '~~~START~~~',
					id: '~~~START~~~, A, 0',
					to: 'A',
				},
				{
					from: '~~~START~~~',
					id: '~~~START~~~, A, 1',
					to: 'A',
				},
				{
					from: 'A',
					id: 'A, B, 2',
					to: 'B',
				},
				{
					from: 'A',
					id: 'A, B, 3',
					to: 'B',
				},
				{
					from: 'B',
					id: 'B, ~~~END~~~, 4',
					to: '~~~END~~~',
				},
				{
					from: 'B',
					id: 'B, ~~~END~~~, 5',
					to: '~~~END~~~',
				},
			]);
		});
	});

	describe('Forks', () => {
		test('Simple', async () => {
			const { forks } = await parseStateDiagram(stateDiagramWithSimpleFork);

			expect(forks.length).toEqual(2);

			expect(forks[0]).not.toEqual(forks[1]);

			expect(forks[0]?.id).toEqual('Fork');
			expect(forks[1]?.id).toEqual('Join');
		});

		test('Normal', async () => {
			const { forks } = await parseStateDiagram(stateDiagramWitNormalForks);

			expect(forks.length).toEqual(4);

			expect(forks[0]).not.toEqual(forks[1]);
			expect(forks[0]).not.toEqual(forks[2]);
			expect(forks[0]).not.toEqual(forks[3]);

			expect(forks[1]).not.toEqual(forks[2]);
			expect(forks[1]).not.toEqual(forks[3]);

			expect(forks[2]).not.toEqual(forks[3]);

			expect(forks[0]?.id).toEqual('Fork1');
			expect(forks[1]?.id).toEqual('Join1');
			expect(forks[2]?.id).toEqual('Fork2');
			expect(forks[3]?.id).toEqual('Join2');
		});
	});

	describe('Choices', () => {
		test('Simple', async () => {
			const { choices } = await parseStateDiagram(stateDiagramWithSimpleChoice);

			expect(choices.length).toEqual(1);
			expect(choices[0]?.id).toEqual('ChoiceState');
		});

		test('Double Path', async () => {
			const { choices } = await parseStateDiagram(stateDiagramDoublePath);

			expect(choices.length).toEqual(2);
			expect(choices[0]?.id).toEqual('ChoiceState1');
			expect(choices[1]?.id).toEqual('ChoiceState2');
		});

		test('Loop', async () => {
			const { choices } = await parseStateDiagram(stateDiagramWithLoopChoice);

			expect(choices.length).toEqual(2);
			expect(choices[0]?.id).toEqual('ChoiceState1');
			expect(choices[1]?.id).toEqual('ChoiceState2');
		});
	});
});
