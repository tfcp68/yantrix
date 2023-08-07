import { describe, expect, test } from 'vitest';
import { parseStateDiagram } from '../src/index.js';

describe('State Diagram Parser', () => {
	describe('Common', () => {
		test('Empty Input', async () => {
			const diagramText = '';

			try {
				await parseStateDiagram(diagramText);
				expect(true).toEqual(false);
			} catch (e) {
				expect(e).instanceof(Error);
			}
		});

		test('Empty Diagram', async () => {
			const diagramText = `stateDiagram-v2`;
			const parsedDiagram = await parseStateDiagram(diagramText);

			expect(parsedDiagram.notes).toEqual([]);
			expect(parsedDiagram.actions).toEqual([]);
			expect(parsedDiagram.states).toEqual([]);
			expect(parsedDiagram.forks).toEqual([]);
			expect(parsedDiagram.choices).toEqual([]);
		});

		test('Basic State Diagram', async () => {
			const diagramText = `
				stateDiagram-v2
				
				[*] --> State1
				State1 --> State2 : Transition 1
				State1 --> State3 : Transition 2
				State2 --> State4 : Transition 3 
				State3 --> [*]
				`;

			const parsedDiagram = await parseStateDiagram(diagramText);

			const expectedStates = [
				{ id: '~~~START~~~', caption: '~~~START~~~' },
				{ id: 'State1', caption: 'State1' },
				{ id: 'State2', caption: 'State2' },
				{ id: 'State3', caption: 'State3' },
				{ id: 'State4', caption: 'State4' },
				{ id: '~~~END~~~', caption: '~~~END~~~' },
			];

			const expectedTransitions = [
				{
					from: '~~~START~~~',
					to: 'State1',
					id: '~~~START~~~, State1, 0',
				},
				{ from: 'State1', to: 'State2', id: 'Transition 1' },
				{ from: 'State1', to: 'State3', id: 'Transition 2' },
				{ from: 'State2', to: 'State4', id: 'Transition 3' },
				{ from: 'State3', to: '~~~END~~~', id: 'State3, ~~~END~~~, 4' },
			];

			expect(parsedDiagram.states).toEqual(expectedStates);
			expect(parsedDiagram.actions).toEqual(expectedTransitions);
			expect(parsedDiagram.notes).toEqual([]);
			expect(parsedDiagram.choices).toEqual([]);
			expect(parsedDiagram.forks).toEqual([]);
		});
	});

	describe('Notes', () => {
		test('One Line', async () => {
			const diagramText = `
			  	stateDiagram-v2
			  
			  	[*] --> State1 : Initial
			  	State1 --> State2 : Transition 1
			  	note left of State2: This is a note over State2
			  	State1 --> State3 : Transition 2
			  	note right of State3: This is a note over State3
			  	`;

			const { notes } = await parseStateDiagram(diagramText);

			expect(notes.length).toEqual(2);
			expect(notes[0].over).toEqual('State2');
			expect(notes[1].over).toEqual('State3');
			expect(notes[0].text[0]).toEqual('This is a note over State2');
			expect(notes[1].text[0]).toEqual('This is a note over State3');
		});

		test('Multiline', async () => {
			const diagramText = `
			  	stateDiagram-v2

			  	[*] --> State1
			  	State1 --> State2
			  	State2 --> State3
			  	Note left of State2
					This is a multiline
					note left of State2
					in the state diagram
			  	End note
			  	Note right of State3
					This is another multiline
					note right of State3
					in the same state diagram
			  	End note
			  	`;

			const { notes } = await parseStateDiagram(diagramText);
			const untab = (str: string) => str.replaceAll('\t', '');

			const expectedFirstNote =
				'This is a multiline\n' +
				'note left of State2\n' +
				'in the state diagram';

			const expectedSecondNote =
				'This is another multiline\n' +
				'note right of State3\n' +
				'in the same state diagram';

			expect(notes.length).toEqual(2);

			expect(notes[0].over).toEqual('State2');
			expect(notes[1].over).toEqual('State3');

			expect(untab(notes[0].text[0])).toEqual(expectedFirstNote);
			expect(untab(notes[1].text[0])).toEqual(expectedSecondNote);
		});
	});
});
