import { assign, setup } from 'xstate';

export const feedbackMachineEvents = {
	'feedback.good': 'feedback.good',
	'feedback.bad': 'feedback.bad',
	'feedback.update': 'feedback.update',
	'back': 'back',
	'submit': 'submit',
	'restart': 'restart',
	'close': 'close',
} as const;

export const feedbackMachineStates = {
	prompt: 'prompt',
	closed: 'closed',
	form: 'form',
	thanks: 'thanks',
} as const;

type TFeedbackGoodEvent = {
	type: typeof feedbackMachineEvents['feedback.good'];
};

type TFeedbackBadEvent = {
	type: typeof feedbackMachineEvents['feedback.bad'];
};

type TFeedbackUpdateEvent = {
	type: typeof feedbackMachineEvents['feedback.update'];
	value: string;
};

type TBackEvent = {
	type: typeof feedbackMachineEvents['back'];
};

type TSubmitEvent = {
	type: typeof feedbackMachineEvents['submit'];
};

type TRestartEvent = {
	type: typeof feedbackMachineEvents['restart'];
	value: string;
};

type TCloseEvent = {
	type: typeof feedbackMachineEvents['close'];
};

export const feedbackMachine = setup({
	types: {
		context: {} as { feedback: string },
		events: {} as TFeedbackBadEvent
		| TFeedbackGoodEvent
		| TFeedbackUpdateEvent
		| TBackEvent
		| TSubmitEvent
		| TRestartEvent
		| TCloseEvent,
	},
	guards: {
		feedbackValid: ({ context }) => context.feedback.length > 0,
	},
}).createMachine({
	id: 'feedback',
	context: {
		feedback: '',
	},
	initial: 'closed',
	states: {
		prompt: {
			on: {
				[feedbackMachineEvents['feedback.good']]: 'thanks',
				[feedbackMachineEvents['feedback.bad']]: 'form',
			},
		},
		form: {
			on: {
				[feedbackMachineEvents['feedback.update']]: {
					actions: assign({
						feedback: ({ event }) => event.value,
					}),
				},
				[feedbackMachineEvents.back]: { target: 'prompt' },
				[feedbackMachineEvents.submit]: {
					guard: 'feedbackValid',
					target: feedbackMachineStates.thanks,
				},
			},
		},
		thanks: {},
		closed: {
			on: {
				[feedbackMachineEvents.restart]: {
					target: [feedbackMachineStates.prompt],
					actions: assign({
						feedback: ({ event }) => event.value,
					}),
				},
			},
		},
	},
	on: {
		[feedbackMachineEvents.close]: `.${feedbackMachineStates.closed}`,
	},
});
