import { describe, expect, test } from 'vitest';
import { parseStateDiagram } from '../src/index.js';

describe('State Diagram Parser', () => {
	describe('Common', () => {
		test('Empty Input Error', async () => {
			const diagramText = '';
			await expect(parseStateDiagram(diagramText)).rejects.toThrowError();
		});

		test('Invalid Diagram Type', async () => {
			const diagramText = 'invalidDiagram';
			await expect(parseStateDiagram(diagramText)).rejects.toThrowError();
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
			
			[*] --> State1: Initial
			State1 --> State2 : Action 1
			State1 --> State3 : Action 2
			State2 --> State4 : Action 3 
			State3 --> [*]: End
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

			const expectedActions = [
				{
					from: '~~~START~~~',
					to: 'State1',
					id: 'Initial',
				},
				{ from: 'State1', to: 'State2', id: 'Action 1' },
				{ from: 'State1', to: 'State3', id: 'Action 2' },
				{ from: 'State2', to: 'State4', id: 'Action 3' },
				{ from: 'State3', to: '~~~END~~~', id: 'End' },
			];

			expect(parsedDiagram.states).toEqual(expectedStates);
			expect(parsedDiagram.actions).toEqual(expectedActions);
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
			const untab = (str: string) => str.replace(/\t/g, '');

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

		test('Empty Note', async () => {
			const diagramText = `
			stateDiagram-v2

			[*] --> State1
			State1 --> State2 
			State2 --> State3
			Note left of State2
			End note
			`;

			const { notes } = await parseStateDiagram(diagramText);

			expect(notes.length).toEqual(1);
			expect(notes[0].over).toEqual('State2');
			expect(notes[0].text[0]).toEqual('');
		});
	});

	describe('States And Actions', () => {
		test('Single State', async () => {
			const diagramText = `
				stateDiagram-v2
				[*] --> State1
				`;

			const result = await parseStateDiagram(diagramText);

			expect(result.states).toEqual([
				{ id: '~~~START~~~', caption: '~~~START~~~' },
				{ id: 'State1', caption: 'State1' },
			]);

			expect(result.actions).toEqual([
				{
					from: '~~~START~~~',
					to: 'State1',
					id: '~~~START~~~, State1, 0',
				},
			]);

			expect(result.notes).toEqual([]);
			expect(result.choices).toEqual([]);
			expect(result.forks).toEqual([]);
		});

		test('Multiple States', async () => {
			const diagramText = `
			stateDiagram-v2
			[*] --> State1
			State1 --> State2
			State2 --> [*]
			`;

			const result = await parseStateDiagram(diagramText);

			expect(result.states).toEqual([
				{ id: '~~~START~~~', caption: '~~~START~~~' },
				{ id: 'State1', caption: 'State1' },
				{ id: 'State2', caption: 'State2' },
				{ id: '~~~END~~~', caption: '~~~END~~~' },
			]);

			expect(result.actions).toEqual([
				{
					from: '~~~START~~~',
					to: 'State1',
					id: '~~~START~~~, State1, 0',
				},
				{ from: 'State1', to: 'State2', id: 'State1, State2, 1' },
				{ from: 'State2', to: '~~~END~~~', id: 'State2, ~~~END~~~, 2' },
			]);

			expect(result.notes).toEqual([]);
			expect(result.choices).toEqual([]);
			expect(result.forks).toEqual([]);
		});

		test('All To End', async () => {
			const diagramText = `
			stateDiagram-v2

			[*] --> State1
			State1 --> State2
			State1 --> [*]
			State2 --> [*]
			[*] --> [*]
			`;

			const result = await parseStateDiagram(diagramText);

			expect(result.states).toEqual([
				{ id: '~~~START~~~', caption: '~~~START~~~' },
				{ id: 'State1', caption: 'State1' },
				{ id: 'State2', caption: 'State2' },
				{ id: '~~~END~~~', caption: '~~~END~~~' },
			]);

			expect(result.actions).toEqual([
				{
					from: '~~~START~~~',
					to: 'State1',
					id: '~~~START~~~, State1, 0',
				},
				{ from: 'State1', to: 'State2', id: 'State1, State2, 1' },
				{ from: 'State1', to: '~~~END~~~', id: 'State1, ~~~END~~~, 2' },
				{ from: 'State2', to: '~~~END~~~', id: 'State2, ~~~END~~~, 3' },
				{
					from: '~~~START~~~',
					to: '~~~END~~~',
					id: '~~~START~~~',
				},
			]);
		});

		test('Doubled Transitions', async () => {
			const diagramText = `
			stateDiagram-v2

			[*] --> State1
			[*] --> State1
			State1 --> State2
			State1 --> State2
			State2 --> [*]
			State2 --> [*]
			`;

			const result = await parseStateDiagram(diagramText);

			expect(result.actions).toEqual([
				{
					from: '~~~START~~~',
					id: '~~~START~~~, State1, 0',
					to: 'State1',
				},
				{
					from: '~~~START~~~',
					id: '~~~START~~~, State1, 1',
					to: 'State1',
				},
				{
					from: 'State1',
					id: 'State1, State2, 2',
					to: 'State2',
				},
				{
					from: 'State1',
					id: 'State1, State2, 3',
					to: 'State2',
				},
				{
					from: 'State2',
					id: 'State2, ~~~END~~~, 4',
					to: '~~~END~~~',
				},
				{
					from: 'State2',
					id: 'State2, ~~~END~~~, 5',
					to: '~~~END~~~',
				},
			]);
		});
	});

	describe('Forks', () => {
		test('Simple', async () => {
			const diagramText = `
			stateDiagram-v2
			
			state ForkState <<fork>>
			state JoinState <<join>>
			
		  	[*] --> ForkState
		  	ForkState --> State2
		  	ForkState --> State3
	
		  	State2 --> JoinState
		  	State3 --> JoinState
		  	JoinState --> [*]
			`;

			const { forks } = await parseStateDiagram(diagramText);

			expect(forks.length).toEqual(2);

			expect(forks[0]).not.toEqual(forks[1]);

			expect(forks[0].id).toEqual('ForkState');
			expect(forks[1].id).toEqual('JoinState');
		});

		test('Two Triple', async () => {
			const diagramText = `
			stateDiagram-v2

			state ForkState1 <<fork>>
			state JoinState1 <<join>>
			
			state ForkState2 <<fork>>
			state JoinState2 <<join>>
			
			[*] --> ForkState1
			ForkState1 --> StateA
			ForkState1 --> StateB
			ForkState1 --> StateC
			StateA --> JoinState1
			StateB --> JoinState1
			StateC --> JoinState1
			JoinState1 --> MiddleState
			MiddleState --> ForkState2
			
			ForkState2 --> StateX
			ForkState2 --> StateY
			ForkState2 --> StateZ
			StateX --> JoinState2
			StateY --> JoinState2
			StateZ --> JoinState2
			
			JoinState2 --> [*]
			`;

			const { forks } = await parseStateDiagram(diagramText);

			expect(forks.length).toEqual(4);

			expect(forks[0]).not.toEqual(forks[1]);
			expect(forks[0]).not.toEqual(forks[2]);
			expect(forks[0]).not.toEqual(forks[3]);

			expect(forks[1]).not.toEqual(forks[2]);
			expect(forks[1]).not.toEqual(forks[3]);

			expect(forks[2]).not.toEqual(forks[3]);

			expect(forks[0].id).toEqual('ForkState1');
			expect(forks[1].id).toEqual('JoinState1');
			expect(forks[2].id).toEqual('ForkState2');
			expect(forks[3].id).toEqual('JoinState2');
		});
	});

	describe('Choices', () => {
		test('Common', async () => {
			const diagramText = `
			stateDiagram-v2

			state IfState <<choice>>
			
			[*] --> IsPositive
			IsPositive --> IfState
			IfState --> False: if n < 0
			IfState --> True : if n >= 0
			`;

			const { choices } = await parseStateDiagram(diagramText);

			expect(choices.length).toEqual(1);
			expect(choices[0].id).toEqual('IfState');
		});

		test('Three Choice Paths', async () => {
			const diagramText = `
			stateDiagram-v2
			state CheckValue <<choice>>
		
			[*] --> CheckValue
			CheckValue --> LessThanTen: if value < 10
			CheckValue --> BetweenTenAndTwenty: if value >= 10 and value <= 20
			CheckValue --> GreaterThanTwenty: if value > 20
			LessThanTen --> [*]
			BetweenTenAndTwenty --> [*]
			GreaterThanTwenty --> [*]
			`;

			const { choices } = await parseStateDiagram(diagramText);

			expect(choices.length).toEqual(1);
			expect(choices[0].id).toEqual('CheckValue');
		});
	});
});
