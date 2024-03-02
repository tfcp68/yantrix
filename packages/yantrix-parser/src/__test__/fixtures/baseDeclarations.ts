export const baseEmpty = {
	contextDescription: [],
	emit: [],
	subscribe: [],
};
export const baseContext = {
	contextDescription: [
		{
			context: {
				KeyItemDeclaration: {
					TargetProperty: 'leftsideproperty',
				},
			},
			KeyItemDeclaration: {
				TargetProperty: 'rightsideproperty',
			},
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
			payload: {
				KeyItemDeclaration: {
					TargetProperty: 'keylist',
				},
			},
		},
	],
};
