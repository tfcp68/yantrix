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
			const expectedResult = '{"transitions":{},"states":[]}';
			expect(JSON.stringify(stateDiagram)).toEqual(expectedResult);
		});
		test('simpleTransition', async () => {
			const diagramText = simpleTransition;
			const parsedDiagram = await parseStateDiagram(diagramText);
			const stateDiagram = await createStateDiagram(parsedDiagram);
			const expectedResult =
				'{"transitions":{"A":{"B":{"actionsPath":[{"action":["A, B, 0"],"note":[]}]}}},"states":[{"id":"A","caption":"A","actionsPath":[{"action":["A, B, 0"],"note":[]}],"notes":[]},{"id":"B","caption":"B","actionsPath":[],"notes":[]}]}';
			expect(JSON.stringify(stateDiagram)).toEqual(expectedResult);
		});
		test('simpleTransitionCompleted', async () => {
			const diagramText = simpleTransitionCompleted;
			const parsedDiagram = await parseStateDiagram(diagramText);
			const stateDiagram = await createStateDiagram(parsedDiagram);
			const expectedResult =
				'{"transitions":{"~~~START~~~":{"A":{"actionsPath":[{"action":["~~~START~~~, A, 0"],"note":[]}]}},"A":{"B":{"actionsPath":[{"action":["A, B, 1"],"note":[]}]}},"B":{"~~~END~~~":{"actionsPath":[{"action":["B, ~~~END~~~, 2"],"note":[]}]}}},"states":[{"id":"~~~START~~~","caption":"~~~START~~~","actionsPath":[{"action":["~~~START~~~, A, 0"],"note":[]}],"notes":[]},{"id":"A","caption":"A","actionsPath":[{"action":["A, B, 1"],"note":[]}],"notes":[]},{"id":"B","caption":"B","actionsPath":[{"action":["B, ~~~END~~~, 2"],"note":[]}],"notes":[]},{"id":"~~~END~~~","caption":"~~~END~~~","actionsPath":[],"notes":[]}]}';
			expect(JSON.stringify(stateDiagram)).toEqual(expectedResult);
		});
		test('simpleTransitionWithComments', async () => {
			const diagramText = simpleTransitionWithComments;
			const parsedDiagram = await parseStateDiagram(diagramText);
			const stateDiagram = await createStateDiagram(parsedDiagram);
			const expectedResult =
				'{"transitions":{"~~~START~~~":{"A":{"actionsPath":[{"action":["Start"],"note":[]}]}},"A":{"B":{"actionsPath":[{"action":["Transition 1"],"note":[]}]}},"B":{"~~~END~~~":{"actionsPath":[{"action":["End"],"note":[]}]}}},"states":[{"id":"~~~START~~~","caption":"~~~START~~~","actionsPath":[{"action":["Start"],"note":[]}],"notes":[]},{"id":"A","caption":"A","actionsPath":[{"action":["Transition 1"],"note":[]}],"notes":[]},{"id":"B","caption":"B","actionsPath":[{"action":["End"],"note":[]}],"notes":[]},{"id":"~~~END~~~","caption":"~~~END~~~","actionsPath":[],"notes":[]}]}';
			expect(JSON.stringify(stateDiagram)).toEqual(expectedResult);
		});
		test('stateDiagramWithChoice', async () => {
			const diagramText = stateDiagramWithChoice;
			const parsedDiagram = await parseStateDiagram(diagramText);
			const stateDiagram = await createStateDiagram(parsedDiagram);
			const expectedResult =
				'{"transitions":{"~~~START~~~":{"B":{"actionsPath":[{"action":["Start","Condition 1"],"note":[[""]]}]},"~~~END~~~":{"actionsPath":[{"action":["Start","Condition 2"],"note":[[""]]}]}},"B":{"~~~END~~~":{"actionsPath":[{"action":["B, ~~~END~~~, 3"],"note":[]}]}}},"states":[{"id":"~~~START~~~","caption":"~~~START~~~","actionsPath":[{"action":["Start","Condition 1"],"note":[[""]]},{"action":["Start","Condition 2"],"note":[[""]]}],"notes":[]},{"id":"B","caption":"B","actionsPath":[{"action":["B, ~~~END~~~, 3"],"note":[]}],"notes":[]},{"id":"~~~END~~~","caption":"~~~END~~~","actionsPath":[],"notes":[]}]}';
			expect(JSON.stringify(stateDiagram)).toEqual(expectedResult);
		});
		test('stateDiagramWithFork', async () => {
			const diagramText = stateDiagramWithFork;
			const parsedDiagram = await parseStateDiagram(diagramText);
			const stateDiagram = await createStateDiagram(parsedDiagram);
			const expectedResult =
				'{"transitions":{"~~~START~~~":{"A":{"actionsPath":[{"action":["Start"],"note":[]}]}},"A":{"B":{"actionsPath":[{"action":["Fork 1"],"note":[]}]},"C":{"actionsPath":[{"action":["Fork 2"],"note":[]}]}},"B":{"D":{"actionsPath":[{"action":["B, D, 3"],"note":[]}]}},"C":{"D":{"actionsPath":[{"action":["C, D, 4"],"note":[]}]}},"D":{"~~~END~~~":{"actionsPath":[{"action":["End"],"note":[]}]}}},"states":[{"id":"~~~START~~~","caption":"~~~START~~~","actionsPath":[{"action":["Start"],"note":[]}],"notes":[]},{"id":"A","caption":"A","actionsPath":[{"action":["Fork 1"],"note":[]},{"action":["Fork 2"],"note":[]}],"notes":[]},{"id":"B","caption":"B","actionsPath":[{"action":["B, D, 3"],"note":[]}],"notes":[]},{"id":"C","caption":"C","actionsPath":[{"action":["C, D, 4"],"note":[]}],"notes":[]},{"id":"D","caption":"D","actionsPath":[{"action":["End"],"note":[]}],"notes":[]},{"id":"~~~END~~~","caption":"~~~END~~~","actionsPath":[],"notes":[]}]}';
			expect(JSON.stringify(stateDiagram)).toEqual(expectedResult);
		});
		test('stateDiagramWithLoopCondition', async () => {
			const diagramText = stateDiagramWithLoopCondition;
			const parsedDiagram = await parseStateDiagram(diagramText);
			await expect(
				createStateDiagram(parsedDiagram)
			).rejects.toThrowError(
				'Link to itself from the choice side. D-->D'
			);
		});
		test('stateDiagramWithLeftSideNote', async () => {
			const diagramText = stateDiagramWithLeftSideNote;
			const parsedDiagram = await parseStateDiagram(diagramText);
			const stateDiagram = await createStateDiagram(parsedDiagram);
			const expectedResult =
				'{"transitions":{"~~~START~~~":{"A":{"actionsPath":[{"action":["~~~START~~~, A, 0"],"note":[]}]}},"A":{"B":{"actionsPath":[{"action":["A, B, 1"],"note":[]}]}},"B":{"~~~END~~~":{"actionsPath":[{"action":["B, ~~~END~~~, 2"],"note":[]}]}}},"states":[{"id":"~~~START~~~","caption":"~~~START~~~","actionsPath":[{"action":["~~~START~~~, A, 0"],"note":[]}],"notes":[]},{"id":"A","caption":"A","actionsPath":[{"action":["A, B, 1"],"note":[]}],"notes":[["simple left side note"]]},{"id":"B","caption":"B","actionsPath":[{"action":["B, ~~~END~~~, 2"],"note":[]}],"notes":[]},{"id":"~~~END~~~","caption":"~~~END~~~","actionsPath":[],"notes":[]}]}';
			expect(JSON.stringify(stateDiagram)).toEqual(expectedResult);
		});
		test('stateDiagramWithRightSideNote', async () => {
			const diagramText = stateDiagramWithRightSideNote;
			const parsedDiagram = await parseStateDiagram(diagramText);
			const stateDiagram = await createStateDiagram(parsedDiagram);
			const expectedResult =
				'{"transitions":{"~~~START~~~":{"A":{"actionsPath":[{"action":["~~~START~~~, A, 0"],"note":[]}]}},"A":{"B":{"actionsPath":[{"action":["A, B, 1"],"note":[]}]}},"B":{"~~~END~~~":{"actionsPath":[{"action":["B, ~~~END~~~, 2"],"note":[]}]}}},"states":[{"id":"~~~START~~~","caption":"~~~START~~~","actionsPath":[{"action":["~~~START~~~, A, 0"],"note":[]}],"notes":[]},{"id":"A","caption":"A","actionsPath":[{"action":["A, B, 1"],"note":[]}],"notes":[["simple right side note","another simple left side note","in 2 lines"]]},{"id":"B","caption":"B","actionsPath":[{"action":["B, ~~~END~~~, 2"],"note":[]}],"notes":[]},{"id":"~~~END~~~","caption":"~~~END~~~","actionsPath":[],"notes":[]}]}';
			expect(JSON.stringify(stateDiagram)).toEqual(expectedResult);
		});
		test('stateDiagramWithChoiceAndNote', async () => {
			const diagramText = stateDiagramWithChoiceAndNote;
			const parsedDiagram = await parseStateDiagram(diagramText);
			const stateDiagram = await createStateDiagram(parsedDiagram);
			const expectedResult =
				'{"transitions":{"~~~START~~~":{"B":{"actionsPath":[{"action":["~~~START~~~, A, 0","A, B, 1"],"note":[["simple right side note","another simple left side note","in 2 lines"]]}]},"C":{"actionsPath":[{"action":["~~~START~~~, A, 0","A, C, 2"],"note":[["simple right side note","another simple left side note","in 2 lines"]]}]}},"C":{"~~~END~~~":{"actionsPath":[{"action":["C, ~~~END~~~, 3"],"note":[]}]}},"B":{"~~~END~~~":{"actionsPath":[{"action":["B, ~~~END~~~, 4"],"note":[]}]}}},"states":[{"id":"~~~START~~~","caption":"~~~START~~~","actionsPath":[{"action":["~~~START~~~, A, 0","A, B, 1"],"note":[["simple right side note","another simple left side note","in 2 lines"]]},{"action":["~~~START~~~, A, 0","A, C, 2"],"note":[["simple right side note","another simple left side note","in 2 lines"]]}],"notes":[]},{"id":"B","caption":"B","actionsPath":[{"action":["B, ~~~END~~~, 4"],"note":[]}],"notes":[]},{"id":"C","caption":"C","actionsPath":[{"action":["C, ~~~END~~~, 3"],"note":[]}],"notes":[]},{"id":"~~~END~~~","caption":"~~~END~~~","actionsPath":[],"notes":[]}]}';
			expect(JSON.stringify(stateDiagram)).toEqual(expectedResult);
		});
		test('stateDiagramWithSameAction', async () => {
			const diagramText = stateDiagramWithSameAction;
			const parsedDiagram = await parseStateDiagram(diagramText);
			const stateDiagram = await createStateDiagram(parsedDiagram);
			const expectedResult =
				'{"transitions":{"~~~START~~~":{"A":{"actionsPath":[{"action":["Transition"],"note":[]}]}},"A":{"B":{"actionsPath":[{"action":["Transition"],"note":[]}]},"C":{"actionsPath":[{"action":["A, C, 2"],"note":[]}]}},"C":{"~~~END~~~":{"actionsPath":[{"action":["C, ~~~END~~~, 3"],"note":[]}]}},"B":{"~~~END~~~":{"actionsPath":[{"action":["B, ~~~END~~~, 4"],"note":[]}]}}},"states":[{"id":"~~~START~~~","caption":"~~~START~~~","actionsPath":[{"action":["Transition"],"note":[]}],"notes":[]},{"id":"A","caption":"A","actionsPath":[{"action":["Transition"],"note":[]},{"action":["A, C, 2"],"note":[]}],"notes":[]},{"id":"B","caption":"B","actionsPath":[{"action":["B, ~~~END~~~, 4"],"note":[]}],"notes":[]},{"id":"C","caption":"C","actionsPath":[{"action":["C, ~~~END~~~, 3"],"note":[]}],"notes":[]},{"id":"~~~END~~~","caption":"~~~END~~~","actionsPath":[],"notes":[]}]}';
			expect(JSON.stringify(stateDiagram)).toEqual(expectedResult);
		});
		test('stateDiagramWithNamedStates', async () => {
			const diagramText = stateDiagramWithNamedStates;
			const parsedDiagram = await parseStateDiagram(diagramText);
			const stateDiagram = await createStateDiagram(parsedDiagram);
			const expectedResult =
				'{"transitions":{"~~~START~~~":{"A":{"actionsPath":[{"action":["~~~START~~~, A, 0"],"note":[]}]}},"A":{"B":{"actionsPath":[{"action":["A, B, 1"],"note":[]}]}},"B":{"~~~END~~~":{"actionsPath":[{"action":["B, ~~~END~~~, 2"],"note":[]}]}}},"states":[{"id":"~~~START~~~","caption":"~~~START~~~","actionsPath":[{"action":["~~~START~~~, A, 0"],"note":[]}],"notes":[]},{"id":"A","caption":"Lesha","actionsPath":[{"action":["A, B, 1"],"note":[]}],"notes":[]},{"id":"B","caption":"B","actionsPath":[{"action":["B, ~~~END~~~, 2"],"note":[]}],"notes":[]},{"id":"~~~END~~~","caption":"~~~END~~~","actionsPath":[],"notes":[]}]}';
			expect(JSON.stringify(stateDiagram)).toEqual(expectedResult);
		});
		test('stateDiagramDoublePath', async () => {
			const diagramText = stateDiagramDoublePath;
			const parsedDiagram = await parseStateDiagram(diagramText);
			const stateDiagram = await createStateDiagram(parsedDiagram);
			const expectedResult =
				'{"transitions":{"~~~START~~~":{"A":{"actionsPath":[{"action":["~~~START~~~, A, 0"],"note":[]}]}},"A":{"B":{"actionsPath":[{"action":["A, C1, 1","C1, B, 3"],"note":[["this is multiline","comment left of","first choice"]]},{"action":["A, C1, 1","C1, C2, 2","C2, B, 4"],"note":[["this is multiline","comment left of","first choice"],["this is another","multiline comment","right of second choice"]]}]},"D":{"actionsPath":[{"action":["A, C1, 1","C1, C2, 2","C2, D, 5"],"note":[["this is multiline","comment left of","first choice"],["this is another","multiline comment","right of second choice"]]}]}},"B":{"~~~END~~~":{"actionsPath":[{"action":["B, ~~~END~~~, 6"],"note":[]}]}},"D":{"~~~END~~~":{"actionsPath":[{"action":["D, ~~~END~~~, 7"],"note":[]}]}}},"states":[{"id":"~~~START~~~","caption":"~~~START~~~","actionsPath":[{"action":["~~~START~~~, A, 0"],"note":[]}],"notes":[]},{"id":"A","caption":"A","actionsPath":[{"action":["A, C1, 1","C1, B, 3"],"note":[["this is multiline","comment left of","first choice"]]},{"action":["A, C1, 1","C1, C2, 2","C2, B, 4"],"note":[["this is multiline","comment left of","first choice"],["this is another","multiline comment","right of second choice"]]},{"action":["A, C1, 1","C1, C2, 2","C2, D, 5"],"note":[["this is multiline","comment left of","first choice"],["this is another","multiline comment","right of second choice"]]}],"notes":[]},{"id":"B","caption":"B","actionsPath":[{"action":["B, ~~~END~~~, 6"],"note":[]}],"notes":[]},{"id":"D","caption":"D","actionsPath":[{"action":["D, ~~~END~~~, 7"],"note":[]}],"notes":[]},{"id":"~~~END~~~","caption":"~~~END~~~","actionsPath":[],"notes":[]}]}';
			expect(JSON.stringify(stateDiagram)).toEqual(expectedResult);
		});
	});
});
