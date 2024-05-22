export const stateDiagramWithLoopConditionExpectedResultString =
	'Link to itself from the choice side. ChoiceState2-->ChoiceState2';

export const emptyStateDiagramExpectedResult = {
	transitions: {},
	states: [],
};

export const simpleTransitionExpectedResult = {
	transitions: {
		A: {
			B: {
				actionsPath: [
					{
						action: ['A, B, 0'],
						note: [],
					},
				],
			},
		},
	},
	states: [
		{
			id: 'A',
			caption: 'A',
			actionsPath: [
				{
					action: ['A, B, 0'],
					note: [],
				},
			],
			notes: [],
		},
		{
			id: 'B',
			caption: 'B',
			actionsPath: [],
			notes: [],
		},
	],
};

export const simpleTransitionCompletedExpectedResult = {
	transitions: {
		'~~~START~~~': {
			A: {
				actionsPath: [
					{
						action: ['~~~START~~~, A, 0'],
						note: [],
					},
				],
			},
		},
		A: {
			B: {
				actionsPath: [
					{
						action: ['A, B, 1'],
						note: [],
					},
				],
			},
		},
		B: {
			'~~~END~~~': {
				actionsPath: [
					{
						action: ['B, ~~~END~~~, 2'],
						note: [],
					},
				],
			},
		},
	},
	states: [
		{
			id: '~~~START~~~',
			caption: '~~~START~~~',
			actionsPath: [
				{
					action: ['~~~START~~~, A, 0'],
					note: [],
				},
			],
			notes: [],
		},
		{
			id: 'A',
			caption: 'A',
			actionsPath: [
				{
					action: ['A, B, 1'],
					note: [],
				},
			],
			notes: [],
		},
		{
			id: 'B',
			caption: 'B',
			actionsPath: [
				{
					action: ['B, ~~~END~~~, 2'],
					note: [],
				},
			],
			notes: [],
		},
		{
			id: '~~~END~~~',
			caption: '~~~END~~~',
			actionsPath: [],
			notes: [],
		},
	],
};

export const simpleTransitionWithCommentsExpectedResult = {
	transitions: {
		'~~~START~~~': {
			A: {
				actionsPath: [
					{
						action: ['Start'],
						note: [],
					},
				],
			},
		},
		A: {
			B: {
				actionsPath: [
					{
						action: ['Transition 1'],
						note: [],
					},
				],
			},
		},
		B: {
			'~~~END~~~': {
				actionsPath: [
					{
						action: ['End'],
						note: [],
					},
				],
			},
		},
	},
	states: [
		{
			id: '~~~START~~~',
			caption: '~~~START~~~',
			actionsPath: [
				{
					action: ['Start'],
					note: [],
				},
			],
			notes: [],
		},
		{
			id: 'A',
			caption: 'A',
			actionsPath: [
				{
					action: ['Transition 1'],
					note: [],
				},
			],
			notes: [],
		},
		{
			id: 'B',
			caption: 'B',
			actionsPath: [
				{
					action: ['End'],
					note: [],
				},
			],
			notes: [],
		},
		{
			id: '~~~END~~~',
			caption: '~~~END~~~',
			actionsPath: [],
			notes: [],
		},
	],
};

export const stateDiagramWithChoiceExpectedResult = {
	transitions: {
		'~~~START~~~': {
			A: {
				actionsPath: [
					{
						action: ['Start', 'Condition 1'],
						note: [['']],
					},
				],
			},
			'~~~END~~~': {
				actionsPath: [
					{
						action: ['Start', 'Condition 2'],
						note: [['']],
					},
				],
			},
		},
		A: {
			'~~~END~~~': {
				actionsPath: [
					{
						action: ['A, ~~~END~~~, 3'],
						note: [],
					},
				],
			},
		},
	},
	states: [
		{
			id: '~~~START~~~',
			caption: '~~~START~~~',
			actionsPath: [
				{
					action: ['Start', 'Condition 1'],
					note: [['']],
				},
				{
					action: ['Start', 'Condition 2'],
					note: [['']],
				},
			],
			notes: [],
		},
		{
			id: 'A',
			caption: 'A',
			actionsPath: [
				{
					action: ['A, ~~~END~~~, 3'],
					note: [],
				},
			],
			notes: [],
		},
		{
			id: '~~~END~~~',
			caption: '~~~END~~~',
			actionsPath: [],
			notes: [],
		},
	],
};

export const stateDiagramWithForkExpectedResult = {
	transitions: {
		'~~~START~~~': {
			Fork: {
				actionsPath: [
					{
						action: ['Start'],
						note: [],
					},
				],
			},
		},
		Fork: {
			B: {
				actionsPath: [
					{
						action: ['Fork 1'],
						note: [],
					},
				],
			},
			C: {
				actionsPath: [
					{
						action: ['Fork 2'],
						note: [],
					},
				],
			},
		},
		B: {
			Join: {
				actionsPath: [
					{
						action: ['B, Join, 3'],
						note: [],
					},
				],
			},
		},
		C: {
			Join: {
				actionsPath: [
					{
						action: ['C, Join, 4'],
						note: [],
					},
				],
			},
		},
		Join: {
			'~~~END~~~': {
				actionsPath: [
					{
						action: ['End'],
						note: [],
					},
				],
			},
		},
	},
	states: [
		{
			id: '~~~START~~~',
			caption: '~~~START~~~',
			actionsPath: [
				{
					action: ['Start'],
					note: [],
				},
			],
			notes: [],
		},
		{
			id: 'Fork',
			caption: 'Fork',
			actionsPath: [
				{
					action: ['Fork 1'],
					note: [],
				},
				{
					action: ['Fork 2'],
					note: [],
				},
			],
			notes: [],
		},
		{
			id: 'B',
			caption: 'B',
			actionsPath: [
				{
					action: ['B, Join, 3'],
					note: [],
				},
			],
			notes: [],
		},
		{
			id: 'C',
			caption: 'C',
			actionsPath: [
				{
					action: ['C, Join, 4'],
					note: [],
				},
			],
			notes: [],
		},
		{
			id: 'Join',
			caption: 'Join',
			actionsPath: [
				{
					action: ['End'],
					note: [],
				},
			],
			notes: [],
		},
		{
			id: '~~~END~~~',
			caption: '~~~END~~~',
			actionsPath: [],
			notes: [],
		},
	],
};

export const stateDiagramWithLeftSideNoteExpectedResult = {
	transitions: {
		'~~~START~~~': {
			A: {
				actionsPath: [
					{
						action: ['~~~START~~~, A, 0'],
						note: [],
					},
				],
			},
		},
		A: {
			B: {
				actionsPath: [
					{
						action: ['A, B, 1'],
						note: [],
					},
				],
			},
		},
		B: {
			'~~~END~~~': {
				actionsPath: [
					{
						action: ['B, ~~~END~~~, 2'],
						note: [],
					},
				],
			},
		},
	},
	states: [
		{
			id: '~~~START~~~',
			caption: '~~~START~~~',
			actionsPath: [
				{
					action: ['~~~START~~~, A, 0'],
					note: [],
				},
			],
			notes: [],
		},
		{
			id: 'A',
			caption: 'A',
			actionsPath: [
				{
					action: ['A, B, 1'],
					note: [],
				},
			],
			notes: [['simple left side note']],
		},
		{
			id: 'B',
			caption: 'B',
			actionsPath: [
				{
					action: ['B, ~~~END~~~, 2'],
					note: [],
				},
			],
			notes: [],
		},
		{
			id: '~~~END~~~',
			caption: '~~~END~~~',
			actionsPath: [],
			notes: [],
		},
	],
};

export const stateDiagramWithRightSideNoteExpectedResult = {
	transitions: {
		'~~~START~~~': {
			A: {
				actionsPath: [
					{
						action: ['~~~START~~~, A, 0'],
						note: [],
					},
				],
			},
		},
		A: {
			B: {
				actionsPath: [
					{
						action: ['A, B, 1'],
						note: [],
					},
				],
			},
		},
		B: {
			'~~~END~~~': {
				actionsPath: [
					{
						action: ['B, ~~~END~~~, 2'],
						note: [],
					},
				],
			},
		},
	},
	states: [
		{
			id: '~~~START~~~',
			caption: '~~~START~~~',
			actionsPath: [
				{
					action: ['~~~START~~~, A, 0'],
					note: [],
				},
			],
			notes: [],
		},
		{
			id: 'A',
			caption: 'A',
			actionsPath: [
				{
					action: ['A, B, 1'],
					note: [],
				},
			],
			notes: [['simple right side note', 'another simple left side note']],
		},
		{
			id: 'B',
			caption: 'B',
			actionsPath: [
				{
					action: ['B, ~~~END~~~, 2'],
					note: [],
				},
			],
			notes: [],
		},
		{
			id: '~~~END~~~',
			caption: '~~~END~~~',
			actionsPath: [],
			notes: [],
		},
	],
};

export const stateDiagramWithChoiceAndNoteExpectedResult = {
	transitions: {
		'~~~START~~~': {
			B: {
				actionsPath: [
					{
						action: ['~~~START~~~, A, 0', 'A, B, 1'],
						note: [['simple right side note', 'another simple left side note', 'in 2 lines']],
					},
				],
			},
			C: {
				actionsPath: [
					{
						action: ['~~~START~~~, A, 0', 'A, C, 2'],
						note: [['simple right side note', 'another simple left side note', 'in 2 lines']],
					},
				],
			},
		},
		C: {
			'~~~END~~~': {
				actionsPath: [
					{
						action: ['C, ~~~END~~~, 3'],
						note: [],
					},
				],
			},
		},
		B: {
			'~~~END~~~': {
				actionsPath: [
					{
						action: ['B, ~~~END~~~, 4'],
						note: [],
					},
				],
			},
		},
	},
	states: [
		{
			id: '~~~START~~~',
			caption: '~~~START~~~',
			actionsPath: [
				{
					action: ['~~~START~~~, A, 0', 'A, B, 1'],
					note: [['simple right side note', 'another simple left side note', 'in 2 lines']],
				},
				{
					action: ['~~~START~~~, A, 0', 'A, C, 2'],
					note: [['simple right side note', 'another simple left side note', 'in 2 lines']],
				},
			],
			notes: [],
		},
		{
			id: 'B',
			caption: 'B',
			actionsPath: [
				{
					action: ['B, ~~~END~~~, 4'],
					note: [],
				},
			],
			notes: [],
		},
		{
			id: 'C',
			caption: 'C',
			actionsPath: [
				{
					action: ['C, ~~~END~~~, 3'],
					note: [],
				},
			],
			notes: [],
		},
		{
			id: '~~~END~~~',
			caption: '~~~END~~~',
			actionsPath: [],
			notes: [],
		},
	],
};

export const stateDiagramWithSameActionExpectedResult = {
	transitions: {
		'~~~START~~~': {
			A: {
				actionsPath: [
					{
						action: ['Transition'],
						note: [],
					},
				],
			},
		},
		A: {
			B: {
				actionsPath: [
					{
						action: ['Transition'],
						note: [],
					},
				],
			},
			C: {
				actionsPath: [
					{
						action: ['A, C, 2'],
						note: [],
					},
				],
			},
		},
		C: {
			'~~~END~~~': {
				actionsPath: [
					{
						action: ['C, ~~~END~~~, 3'],
						note: [],
					},
				],
			},
		},
		B: {
			'~~~END~~~': {
				actionsPath: [
					{
						action: ['B, ~~~END~~~, 4'],
						note: [],
					},
				],
			},
		},
	},
	states: [
		{
			id: '~~~START~~~',
			caption: '~~~START~~~',
			actionsPath: [
				{
					action: ['Transition'],
					note: [],
				},
			],
			notes: [],
		},
		{
			id: 'A',
			caption: 'A',
			actionsPath: [
				{
					action: ['Transition'],
					note: [],
				},
				{
					action: ['A, C, 2'],
					note: [],
				},
			],
			notes: [],
		},
		{
			id: 'B',
			caption: 'B',
			actionsPath: [
				{
					action: ['B, ~~~END~~~, 4'],
					note: [],
				},
			],
			notes: [],
		},
		{
			id: 'C',
			caption: 'C',
			actionsPath: [
				{
					action: ['C, ~~~END~~~, 3'],
					note: [],
				},
			],
			notes: [],
		},
		{
			id: '~~~END~~~',
			caption: '~~~END~~~',
			actionsPath: [],
			notes: [],
		},
	],
};

export const stateDiagramWithNamedStatesExpectedResult = {
	transitions: {
		'~~~START~~~': {
			A: {
				actionsPath: [
					{
						action: ['~~~START~~~, A, 0'],
						note: [],
					},
				],
			},
		},
		A: {
			B: {
				actionsPath: [
					{
						action: ['A, B, 1'],
						note: [],
					},
				],
			},
		},
		B: {
			'~~~END~~~': {
				actionsPath: [
					{
						action: ['B, ~~~END~~~, 2'],
						note: [],
					},
				],
			},
		},
	},
	states: [
		{
			id: '~~~START~~~',
			caption: '~~~START~~~',
			actionsPath: [
				{
					action: ['~~~START~~~, A, 0'],
					note: [],
				},
			],
			notes: [],
		},
		{
			id: 'A',
			caption: 'Lesha',
			actionsPath: [
				{
					action: ['A, B, 1'],
					note: [],
				},
			],
			notes: [],
		},
		{
			id: 'B',
			caption: 'B',
			actionsPath: [
				{
					action: ['B, ~~~END~~~, 2'],
					note: [],
				},
			],
			notes: [],
		},
		{
			id: '~~~END~~~',
			caption: '~~~END~~~',
			actionsPath: [],
			notes: [],
		},
	],
};

export const stateDiagramDoublePathExpectedResult = {
	transitions: {
		'~~~START~~~': {
			A: {
				actionsPath: [
					{
						action: ['~~~START~~~, A, 0'],
						note: [],
					},
				],
			},
		},
		A: {
			B: {
				actionsPath: [
					{
						action: ['A, ChoiceState1, 1', 'ChoiceState1, B, 3'],
						note: [['this is multiline', 'comment left of', 'first choice']],
					},
					{
						action: ['A, ChoiceState1, 1', 'ChoiceState1, ChoiceState2, 2', 'ChoiceState2, B, 4'],
						note: [
							['this is multiline', 'comment left of', 'first choice'],
							['this is another', 'multiline comment', 'right of second choice'],
						],
					},
				],
			},
			D: {
				actionsPath: [
					{
						action: ['A, ChoiceState1, 1', 'ChoiceState1, ChoiceState2, 2', 'ChoiceState2, D, 5'],
						note: [
							['this is multiline', 'comment left of', 'first choice'],
							['this is another', 'multiline comment', 'right of second choice'],
						],
					},
				],
			},
		},
		B: {
			'~~~END~~~': {
				actionsPath: [
					{
						action: ['B, ~~~END~~~, 6'],
						note: [],
					},
				],
			},
		},
		D: {
			'~~~END~~~': {
				actionsPath: [
					{
						action: ['D, ~~~END~~~, 7'],
						note: [],
					},
				],
			},
		},
	},
	states: [
		{
			id: '~~~START~~~',
			caption: '~~~START~~~',
			actionsPath: [
				{
					action: ['~~~START~~~, A, 0'],
					note: [],
				},
			],
			notes: [],
		},
		{
			id: 'A',
			caption: 'A',
			actionsPath: [
				{
					action: ['A, ChoiceState1, 1', 'ChoiceState1, B, 3'],
					note: [['this is multiline', 'comment left of', 'first choice']],
				},
				{
					action: ['A, ChoiceState1, 1', 'ChoiceState1, ChoiceState2, 2', 'ChoiceState2, B, 4'],
					note: [
						['this is multiline', 'comment left of', 'first choice'],
						['this is another', 'multiline comment', 'right of second choice'],
					],
				},
				{
					action: ['A, ChoiceState1, 1', 'ChoiceState1, ChoiceState2, 2', 'ChoiceState2, D, 5'],
					note: [
						['this is multiline', 'comment left of', 'first choice'],
						['this is another', 'multiline comment', 'right of second choice'],
					],
				},
			],
			notes: [],
		},
		{
			id: 'B',
			caption: 'B',
			actionsPath: [
				{
					action: ['B, ~~~END~~~, 6'],
					note: [],
				},
			],
			notes: [],
		},
		{
			id: 'D',
			caption: 'D',
			actionsPath: [
				{
					action: ['D, ~~~END~~~, 7'],
					note: [],
				},
			],
			notes: [],
		},
		{
			id: '~~~END~~~',
			caption: '~~~END~~~',
			actionsPath: [],
			notes: [],
		},
	],
};
