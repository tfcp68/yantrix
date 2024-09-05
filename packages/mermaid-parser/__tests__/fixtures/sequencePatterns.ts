import { BlankInputError, InvalidInputError } from '../../src/sequence/errors/sequenceErrors';

export type TTestCase = {
	groupName: string;
	testName: string;
	input: string;
	expected: any;
};

export const testCases: TTestCase[] = [
	{
		groupName: 'Common',
		testName: 'Empty Input Error',
		input: '',
		expected: new BlankInputError(),
	},
	{
		groupName: 'Common',
		testName: 'Invalid Diagram Type',
		input: 'invalidDiagram',
		expected: new InvalidInputError(),
	},
	{
		groupName: 'Common',
		testName: 'Empty Diagram',
		input: 'sequenceDiagram',
		expected: {
			messages: {},
			notes: {},
			actors: [],
			activations: {},
		},
	},
	{
		groupName: 'Actors',
		testName: 'Actors and participants',
		input: `
        sequenceDiagram
            actor A
            participant B
            A->>B: Message1
            B->>C: Message2
        `,
		expected: {
			messages: {
				A: {
					A: null,
					B: ['Message1'],
					C: null,
				},
				B: {
					A: null,
					B: null,
					C: ['Message2'],
				},
				C: {
					A: null,
					B: null,
					C: null,
				},
			},
			notes: {
				A: null,
				B: null,
				C: null,
			},
			actors: ['A', 'B', 'C'],
			activations: {
				A: [],
				B: [],
				C: [],
			},
		},
	},
	{
		groupName: 'Notes',
		testName: 'Side note',
		input: `
        sequenceDiagram
            note left of A: Note1
            A->>B: Message1
        `,
		expected: {
			messages: {
				A: {
					A: null,
					B: ['Message1'],
				},
				B: {
					A: null,
					B: null,
				},
			},
			notes: {
				A: ['Note1'],
				B: null,
			},
			actors: ['A', 'B'],
			activations: {
				A: [],
				B: [],
			},
		},
	},
	{
		groupName: 'Notes',
		testName: 'Spanning note',
		input: `
        sequenceDiagram
            actor A
            participant B
            note left of A: Note1
            note over A, B: Note2
            A->>+B: Message1
            B-->>-A: Message2
        `,
		expected: {
			messages: {
				A: {
					A: null,
					B: ['Message1'],
				},
				B: {
					A: ['Message2'],
					B: null,
				},
			},
			notes: {
				A: ['Note1', 'Note2'],
				B: ['Note2'],
			},
			actors: ['A', 'B'],
			activations: {
				A: [],
				B: [['Message2']],
			},
		},
	},
	{
		groupName: 'Messages',
		testName: 'Simple message',
		input: `
        sequenceDiagram
            A->>B: Message1
        `,
		expected: {
			messages: {
				A: {
					A: null,
					B: ['Message1'],
				},
				B: {
					A: null,
					B: null,
				},
			},
			notes: {
				A: null,
				B: null,
			},
			actors: ['A', 'B'],
			activations: {
				A: [],
				B: [],
			},
		},
	},
	{
		groupName: 'Messages',
		testName: 'Loop message',
		input: `
        sequenceDiagram
            A->>A: Message1
        `,
		expected: {
			messages: {
				A: {
					A: ['Message1'],
				},
			},
			notes: {
				A: null,
			},
			actors: ['A'],
			activations: {
				A: [],
			},
		},
	},
	{
		groupName: 'Messages',
		testName: 'Different arrow messages',
		input: `
        sequenceDiagram
            A->B: Message1
            B-->A: Message2
            A->>B: Message3
            B-->>A: Message4
            A-xB: Message5
            B--xA: Message6
            A-)B: Message7
            B--)A: Message8
        `,
		expected: {
			messages: {
				A: {
					A: null,
					B: ['Message1', 'Message3', 'Message5', 'Message7'],
				},
				B: {
					A: ['Message2', 'Message4', 'Message6', 'Message8'],
					B: null,
				},
			},
			notes: {
				A: null,
				B: null,
			},
			actors: ['A', 'B'],
			activations: {
				A: [],
				B: [],
			},
		},
	},
	{
		groupName: 'Activations',
		testName: 'Simple activations',
		input: `
        sequenceDiagram
            A->>+B: Message1
            B-->>-A: Message2
        `,
		expected: {
			messages: {
				A: {
					A: null,
					B: ['Message1'],
				},
				B: {
					A: ['Message2'],
					B: null,
				},
			},
			notes: {
				A: null,
				B: null,
			},
			actors: ['A', 'B'],
			activations: {
				A: [],
				B: [['Message2']],
			},
		},
	},
	{
		groupName: 'Activations',
		testName: 'Complex activations',
		input: `
        sequenceDiagram
            B->>+A: Message1
            A->>+B: Message2
            B->>A: Message3
            B->>A: Message4
            B->>-A: Message5
            A->>-B: Message6
        `,
		expected: {
			messages: {
				B: {
					B: null,
					A: ['Message1', 'Message3', 'Message4', 'Message5'],
				},
				A: {
					B: ['Message2', 'Message6'],
					A: null,
				},
			},
			notes: {
				B: null,
				A: null,
			},
			actors: ['B', 'A'],
			activations: {
				B: [['Message3', 'Message4', 'Message5']],
				A: [['Message2', 'Message6']],
			},
		},
	},
	{
		groupName: 'Activations',
		testName: 'Double actor activations',
		input: `
        sequenceDiagram
            A->>+B: Message1
            A->>+B: Message2
            B->>A: Message3
            B->>-A: Message4
            B->>-A: Message5
            A->>B: Message6
            A->>+B: Message7
            B->>B: Message8
            B->>-A: Message9
        `,
		expected: {
			messages: {
				A: {
					A: null,
					B: ['Message1', 'Message2', 'Message6', 'Message7'],
				},
				B: {
					A: ['Message3', 'Message4', 'Message5', 'Message9'],
					B: ['Message8'],
				},
			},
			notes: {
				A: null,
				B: null,
			},
			actors: ['A', 'B'],
			activations: {
				A: [],
				B: [
					['Message3', 'Message4'],
					['Message3', 'Message4', 'Message5'],
					['Message8', 'Message9'],
				],
			},
		},
	},
	{
		groupName: 'Activations',
		testName: 'Three actors activations',
		input: `
        sequenceDiagram
            autonumber
            actor A1
            participant A2
            participant A3
            A1->>+A3: Message1
            A3->>+A2: Message2
            A2-->>-A3: Message3
            A3-->>-A1: Message4
            A1->>A1: Message5
        `,
		expected: {
			messages: {
				A1: {
					A1: ['Message5'],
					A2: null,
					A3: ['Message1'],
				},
				A2: {
					A1: null,
					A2: null,
					A3: ['Message3'],
				},
				A3: {
					A1: ['Message4'],
					A2: ['Message2'],
					A3: null,
				},
			},
			notes: {
				A1: null,
				A2: null,
				A3: null,
			},
			actors: ['A1', 'A2', 'A3'],
			activations: {
				A1: [],
				A2: [['Message3']],
				A3: [['Message2', 'Message4']],
			},
		},
	},
];
