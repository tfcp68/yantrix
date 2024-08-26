export const emptySequenceDiagramExpectedResult = {
	messages: {},
	notes: {},
	actors: [],
	activations: {},
};

export const sequenceDiagramSimpleMessageExpectedResult = {
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
};

export const sequenceDiagramLoopMessageExpectedResult = {
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
};

export const sequenceDiagramDifferentArrowMessagesExpectedResult = {
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
};

export const sequenceDiagramActorsExpectedResult = {
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
};

export const sequenceDiagramSimpleActivationsExpectedResult = {
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
};

export const sequenceDiagramComplexActivationsExpectedResult = {
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
};

export const sequenceDiagramDoubleActorActivationsExpectedResult = {
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
};

export const sequenceDiagramSideNoteExpectedResult = {
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
};

export const sequenceDiagramSpanningNoteExpectedResult = {
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
};

export const sequenceDiagramThreeActorsActivationsExpectedResult = {
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
};
