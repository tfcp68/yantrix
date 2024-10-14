export const stateDiagramWithLoopConditionExpectedResultString
	= 'Link to itself from the choice side. ChoiceState2-->ChoiceState2';

export const emptyStateDiagramExpectedResult = {
	transitions: {},
	states: [],
	actionChains: {},
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
	actionChains: {
		A: {
			'A, B, 0': [
				{
					chain: [],
					state: 'B',
				},
			],
		},
	},
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
		'A': {
			B: {
				actionsPath: [
					{
						action: ['A, B, 1'],
						note: [],
					},
				],
			},
		},
		'B': {
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
	actionChains: {
		'~~~START~~~': {
			'~~~START~~~, A, 0': [
				{
					chain: [
					],
					state: 'A',
				},
			],
		},
		'A': {
			'A, B, 1': [
				{
					chain: [
					],
					state: 'B',
				},
			],
		},
		'B': {
			'B, ~~~END~~~, 2': [
				{
					chain: [
					],
					state: '~~~END~~~',
				},
			],
		},
	},
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
		'A': {
			B: {
				actionsPath: [
					{
						action: ['Transition 1'],
						note: [],
					},
				],
			},
		},
		'B': {
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
	actionChains: {
		'~~~START~~~': {
			Start: [
				{
					chain: [
					],
					state: 'A',
				},
			],
		},
		'A': {
			'Transition 1': [
				{
					chain: [
					],
					state: 'B',
				},
			],
		},
		'B': {
			End: [
				{
					chain: [
					],
					state: '~~~END~~~',
				},
			],
		},
	},
};

export const stateDiagramWithChoiceExpectedResult = {
	transitions: {
		'~~~START~~~': {
			'A': {
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
		'A': {
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
	actionChains: {
		'~~~START~~~': {
			Start: [
				{
					chain: [
						'Condition 1',
					],
					state: 'A',
				},
				{
					chain: [
						'Condition 2',
					],
					state: '~~~END~~~',
				},
			],
		},
		'A': {
			'A, ~~~END~~~, 3': [
				{
					chain: [
					],
					state: '~~~END~~~',
				},
			],
		},
	},
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
		'Fork': {
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
		'B': {
			Join: {
				actionsPath: [
					{
						action: ['B, Join, 3'],
						note: [],
					},
				],
			},
		},
		'C': {
			Join: {
				actionsPath: [
					{
						action: ['C, Join, 4'],
						note: [],
					},
				],
			},
		},
		'Join': {
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
	actionChains: {
		'~~~START~~~': {
			Start: [
				{
					chain: [
					],
					state: 'Fork',
				},
			],
		},
		'Fork': {
			'Fork 1': [
				{
					chain: [
					],
					state: 'B',
				},
			],
			'Fork 2': [
				{
					chain: [
					],
					state: 'C',
				},
			],
		},
		'B': {
			'B, Join, 3': [
				{
					chain: [
					],
					state: 'Join',
				},
			],
		},
		'C': {
			'C, Join, 4': [
				{
					chain: [
					],
					state: 'Join',
				},
			],
		},
		'Join': {
			End: [
				{
					chain: [
					],
					state: '~~~END~~~',
				},
			],
		},
	},
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
		'A': {
			B: {
				actionsPath: [
					{
						action: ['A, B, 1'],
						note: [],
					},
				],
			},
		},
		'B': {
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
	actionChains: {
		'~~~START~~~': {
			'~~~START~~~, A, 0': [
				{
					chain: [
					],
					state: 'A',
				},
			],
		},
		'A': {
			'A, B, 1': [
				{
					chain: [
					],
					state: 'B',
				},
			],
		},
		'B': {
			'B, ~~~END~~~, 2': [
				{
					chain: [
					],
					state: '~~~END~~~',
				},
			],
		},
	},
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
		'A': {
			B: {
				actionsPath: [
					{
						action: ['A, B, 1'],
						note: [],
					},
				],
			},
		},
		'B': {
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
	actionChains: {
		'~~~START~~~': {
			'~~~START~~~, A, 0': [
				{
					chain: [
					],
					state: 'A',
				},
			],
		},
		'A': {
			'A, B, 1': [
				{
					chain: [
					],
					state: 'B',
				},
			],
		},
		'B': {
			'B, ~~~END~~~, 2': [
				{
					chain: [
					],
					state: '~~~END~~~',
				},
			],
		},
	},
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
		'C': {
			'~~~END~~~': {
				actionsPath: [
					{
						action: ['C, ~~~END~~~, 3'],
						note: [],
					},
				],
			},
		},
		'B': {
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
	actionChains: {
		'~~~START~~~': {
			'~~~START~~~, A, 0': [
				{
					chain: [
						'A, B, 1',
					],
					state: 'B',
				},
				{
					chain: [
						'A, C, 2',
					],
					state: 'C',
				},
			],
		},
		'C': {
			'C, ~~~END~~~, 3': [
				{
					chain: [
					],
					state: '~~~END~~~',
				},
			],
		},
		'B': {
			'B, ~~~END~~~, 4': [
				{
					chain: [
					],
					state: '~~~END~~~',
				},
			],
		},
	},
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
		'A': {
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
		'C': {
			'~~~END~~~': {
				actionsPath: [
					{
						action: ['C, ~~~END~~~, 3'],
						note: [],
					},
				],
			},
		},
		'B': {
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
	actionChains: {
		'~~~START~~~': {
			Transition: [
				{
					chain: [
					],
					state: 'A',
				},
			],
		},
		'A': {
			'Transition': [
				{
					chain: [
					],
					state: 'B',
				},
			],
			'A, C, 2': [
				{
					chain: [
					],
					state: 'C',
				},
			],
		},
		'C': {
			'C, ~~~END~~~, 3': [
				{
					chain: [
					],
					state: '~~~END~~~',
				},
			],
		},
		'B': {
			'B, ~~~END~~~, 4': [
				{
					chain: [
					],
					state: '~~~END~~~',
				},
			],
		},
	},
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
		'A': {
			B: {
				actionsPath: [
					{
						action: ['A, B, 1'],
						note: [],
					},
				],
			},
		},
		'B': {
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
	actionChains: {
		'~~~START~~~': {
			'~~~START~~~, A, 0': [
				{
					chain: [
					],
					state: 'A',
				},
			],
		},
		'A': {
			'A, B, 1': [
				{
					chain: [
					],
					state: 'B',
				},
			],
		},
		'B': {
			'B, ~~~END~~~, 2': [
				{
					chain: [
					],
					state: '~~~END~~~',
				},
			],
		},
	},
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
		'A': {
			B: {
				actionsPath: [
					{
						action: ['A, ChoiceState1, 1', 'ChoiceState1, B, 3'],
						note: [['this is multiline', 'comment left of', 'first choice']],
					},
					{
						action: ['A, ChoiceState1, 1', 'predicate1($value)', 'ChoiceState2, B, 5'],
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
						action: ['A, ChoiceState1, 1', 'predicate1($value)', 'predicate2($value)'],
						note: [
							['this is multiline', 'comment left of', 'first choice'],
							['this is another', 'multiline comment', 'right of second choice'],
						],
					},
				],
			},
		},
		'B': {
			'~~~END~~~': {
				actionsPath: [
					{
						action: ['B, ~~~END~~~, 6'],
						note: [],
					},
				],
			},
		},
		'D': {
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
					action: ['A, ChoiceState1, 1', 'predicate1($value)', 'ChoiceState2, B, 5'],
					note: [
						['this is multiline', 'comment left of', 'first choice'],
						['this is another', 'multiline comment', 'right of second choice'],
					],
				},
				{
					action: ['A, ChoiceState1, 1', 'predicate1($value)', 'predicate2($value)'],
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
	actionChains: { '~~~START~~~': { '~~~START~~~, A, 0': [{ chain: [], state: 'A' }] }, 'A': { 'A, ChoiceState1, 1': [{ chain: ['predicate1($value)', 'predicate2($value)'], state: 'D' }, { chain: ['ChoiceState1, B, 3'], state: 'B' }] }, 'B': { 'B, ~~~END~~~, 6': [{ chain: [], state: '~~~END~~~' }] }, 'D': { 'D, ~~~END~~~, 7': [{ chain: [], state: '~~~END~~~' }] } },
};
