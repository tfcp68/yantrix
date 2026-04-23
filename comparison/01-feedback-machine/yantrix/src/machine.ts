// This file re-exports the generated automata and provides named constants
// that mirror the xstate version's feedbackMachineStates / feedbackMachineEvents.
// The generated file is produced at build/dev time via `pnpm run generate`.
export { FeedbackMachineAutomata } from './generated/FeedbackMachineAutomata';

export const feedbackMachineStates = {
	prompt: 'Prompt',
	closed: 'Closed',
	form: 'Form',
	thanks: 'Thanks',
} as const;

export const feedbackMachineActions = {
	good: 'Good',
	bad: 'Bad',
	update: 'Update',
	back: 'Back',
	submit: 'Submit',
	restart: 'Restart',
	close: 'Dismiss',
} as const;
