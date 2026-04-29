// Smoke tests for the generated FeedbackMachineAutomata.
// Run after `pnpm run generate` — the generated file must exist.
// These tests exercise the automata directly, without React or DOM.
import { describe, expect, it } from 'vitest';
import { FeedbackMachineAutomata } from '../src/generated/FeedbackMachineAutomata';

const send = (machine: FeedbackMachineAutomata, action: string, payload: Record<string, unknown> = {}) =>
	machine.dispatch(FeedbackMachineAutomata.createAction(action as never, payload));

const stateOf = (machine: FeedbackMachineAutomata) =>
	Object.keys(FeedbackMachineAutomata.states).find(
		k => FeedbackMachineAutomata.getState(k as never) === machine.state,
	);

const contextOf = (machine: FeedbackMachineAutomata) => machine.getContext().context;

// Restart always carries {feedback:''} to reset context on opening — mirrors xstate's restart assign().
// Back carries no payload, so coalesce preserves prevContext.feedback.
const restart = (machine: FeedbackMachineAutomata) => send(machine, 'Restart', { feedback: '' });

describe('feedbackMachineAutomata', () => {
	it('starts in Closed with empty feedback', () => {
		const m = new FeedbackMachineAutomata();
		expect(stateOf(m)).toBe('Closed');
		expect(contextOf(m).feedback).toBe('');
	});

	it('restart transitions Closed → Prompt', () => {
		const m = new FeedbackMachineAutomata();
		restart(m);
		expect(stateOf(m)).toBe('Prompt');
	});

	it('restart resets feedback to empty', () => {
		const m = new FeedbackMachineAutomata();
		restart(m);
		expect(contextOf(m).feedback).toBe('');
	});

	describe('happy path (Good)', () => {
		it('restart → Good → Thanks', () => {
			const m = new FeedbackMachineAutomata();
			restart(m);
			send(m, 'Good');
			expect(stateOf(m)).toBe('Thanks');
		});

		it('thanks → Dismiss → Closed', () => {
			const m = new FeedbackMachineAutomata();
			restart(m);
			send(m, 'Good');
			send(m, 'Dismiss');
			expect(stateOf(m)).toBe('Closed');
		});
	});

	describe('sad path (Bad + Submit)', () => {
		it('restart → Bad → Form', () => {
			const m = new FeedbackMachineAutomata();
			restart(m);
			send(m, 'Bad');
			expect(stateOf(m)).toBe('Form');
		});

		it('update stores feedback in context', () => {
			const m = new FeedbackMachineAutomata();
			restart(m);
			send(m, 'Bad');
			send(m, 'Update', { value: 'please add dark mode' });
			expect(contextOf(m).feedback).toBe('please add dark mode');
			expect(stateOf(m)).toBe('Form');
		});

		it('submit transitions Form → Thanks with feedback', () => {
			const m = new FeedbackMachineAutomata();
			restart(m);
			send(m, 'Bad');
			send(m, 'Update', { value: 'please add dark mode' });
			send(m, 'Submit');
			expect(stateOf(m)).toBe('Thanks');
			expect(contextOf(m).feedback).toBe('please add dark mode');
		});

		it('full sad path: Dismiss lands in Closed', () => {
			const m = new FeedbackMachineAutomata();
			restart(m);
			send(m, 'Bad');
			send(m, 'Update', { value: 'please add dark mode' });
			send(m, 'Submit');
			send(m, 'Dismiss');
			expect(stateOf(m)).toBe('Closed');
		});

		it('next Restart after sad path resets feedback', () => {
			const m = new FeedbackMachineAutomata();
			restart(m);
			send(m, 'Bad');
			send(m, 'Update', { value: 'please add dark mode' });
			send(m, 'Submit');
			send(m, 'Dismiss');
			restart(m);
			expect(stateOf(m)).toBe('Prompt');
			expect(contextOf(m).feedback).toBe('');
		});
	});

	describe('back navigation', () => {
		it('back returns Form → Prompt', () => {
			const m = new FeedbackMachineAutomata();
			restart(m);
			send(m, 'Bad');
			expect(stateOf(m)).toBe('Form');
			send(m, 'Back');
			expect(stateOf(m)).toBe('Prompt');
		});

		it('feedback is preserved in context after Back', () => {
			const m = new FeedbackMachineAutomata();
			restart(m);
			send(m, 'Bad');
			send(m, 'Update', { value: 'hello' });
			send(m, 'Back');
			expect(contextOf(m).feedback).toBe('hello');
		});
	});

	describe('dismiss from any state', () => {
		it('dismiss from Prompt → Closed', () => {
			const m = new FeedbackMachineAutomata();
			restart(m);
			send(m, 'Dismiss');
			expect(stateOf(m)).toBe('Closed');
		});

		it('dismiss from Form → Closed', () => {
			const m = new FeedbackMachineAutomata();
			restart(m);
			send(m, 'Bad');
			send(m, 'Update', { value: 'some text' });
			send(m, 'Dismiss');
			expect(stateOf(m)).toBe('Closed');
		});
	});

	describe('submit without feedback (no diagram-level guard)', () => {
		it('submit transitions to Thanks even with empty feedback — guard is UI-only', () => {
			const m = new FeedbackMachineAutomata();
			restart(m);
			send(m, 'Bad');
			send(m, 'Submit');
			expect(stateOf(m)).toBe('Thanks');
		});
	});
});
