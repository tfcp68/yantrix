export const baseEmpty = {
	contextDescription: [],
	emit: [],
	subscribe: [],
};
export const baseContext = {
	contextDescription: [
		{
			context: [
				{
					KeyItemDeclaration: {
						TargetProperty: 'LeftSideProperty',
					},
				},
			],
			payload: [
				{
					KeyItemDeclaration: {
						TargetProperty: 'RightSideProperty',
					},
				},
			],
		},
	],
};
export const baseContextWithPrevious = {
	contextDescription: [
		{
			context: [
				{
					KeyItemDeclaration: {
						TargetProperty: 'LeftSideProperty',
					},
				},
			],
			prevContext: [
				{
					KeyItemDeclaration: {
						TargetProperty: 'RightSideProperty',
					},
				},
			],
		},
	],
};
export const baseSubscribe = {
	subscribe: [
		{
			event: 'event',
			action: {
				actionName: 'action',
			},
		},
	],
};

export const baseEmitEvent = {
	emit: [
		{
			eventName: 'eventName ',
			payload: [
				{
					KeyItemDeclaration: {
						TargetProperty: 'keylist',
					},
				},
			],
		},
	],
};
