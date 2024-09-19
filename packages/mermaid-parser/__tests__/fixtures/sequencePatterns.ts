import {
	BlankInputError,
	InvalidInputError,
} from '../../src/sequence/errors/sequenceErrors';

export type TTestCase = {
	testBehaviour: string;
	testCase: string;
	inputDiagram: string;
	expectedResult: any;
};

export const testCases: TTestCase[] = [
	{
		testBehaviour: 'Common',
		testCase: 'Empty Input Error',
		inputDiagram: '',
		expectedResult: new BlankInputError(),
	},
	{
		testBehaviour: 'Common',
		testCase: 'Invalid Diagram Type',
		inputDiagram: 'invalidDiagram',
		expectedResult: new InvalidInputError(),
	},
	{
		testBehaviour: 'Common',
		testCase: 'Empty Diagram',
		inputDiagram: 'sequenceDiagram',
		expectedResult: {
			messages: {},
			notes: {},
			actors: [],
			activations: {},
		},
	},
	{
		testBehaviour: 'Actors',
		testCase: 'Actors and participants',
		inputDiagram: `
        sequenceDiagram
            actor A
            participant B
            A->>B: Message1
            B->>C: Message2
        `,
		expectedResult: {
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
		testBehaviour: 'Notes',
		testCase: 'Side note',
		inputDiagram: `
        sequenceDiagram
            note left of A: Note1
            A->>B: Message1
        `,
		expectedResult: {
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
		testBehaviour: 'Notes',
		testCase: 'Spanning note',
		inputDiagram: `
        sequenceDiagram
            actor A
            participant B
            note left of A: Note1
            note over A, B: Note2
            A->>+B: Message1
            B-->>-A: Message2
        `,
		expectedResult: {
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
		testBehaviour: 'Messages',
		testCase: 'Simple message',
		inputDiagram: `
        sequenceDiagram
            A->>B: Message1
        `,
		expectedResult: {
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
		testBehaviour: 'Messages',
		testCase: 'Loop message',
		inputDiagram: `
        sequenceDiagram
            A->>A: Message1
        `,
		expectedResult: {
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
		testBehaviour: 'Messages',
		testCase: 'Different arrow messages',
		inputDiagram: `
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
		expectedResult: {
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
		testBehaviour: 'Activations',
		testCase: 'Simple activations',
		inputDiagram: `
        sequenceDiagram
            A->>+B: Message1
            B-->>-A: Message2
        `,
		expectedResult: {
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
		testBehaviour: 'Activations',
		testCase: 'Complex activations',
		inputDiagram: `
        sequenceDiagram
            B->>+A: Message1
            A->>+B: Message2
            B->>A: Message3
            B->>A: Message4
            B->>-A: Message5
            A->>-B: Message6
        `,
		expectedResult: {
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
		testBehaviour: 'Activations',
		testCase: 'Double actor activations',
		inputDiagram: `
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
		expectedResult: {
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
		testBehaviour: 'Activations',
		testCase: 'Three actors activations',
		inputDiagram: `
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
		expectedResult: {
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
