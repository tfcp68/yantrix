import { beforeEach, describe, expect, test, vitest } from 'vitest';
import { actionsDictionary, DropdownAutomata, statesDictionary } from './fixtures/DropDownAutomata_generated.js';

let automata: DropdownAutomata;

describe('Codegen output', () => {
	describe('GamePhaseAutomata', () => {
		beforeEach(() => {
			vitest.clearAllTimers();
			vitest.clearAllTimers();
			automata = new DropdownAutomata();
		});
		test('Initial state', () => {
			expect(automata.state).toBe(statesDictionary['/~~~START~~~']);
		});
		test('Pass payload to context', () => {
			automata.dispatch({
				action: actionsDictionary['/RESET (list)'],
				payload: {
					index: 300,
				},
			});
			expect(automata.context).toStrictEqual({
				selectedindex: 300,
			});
		});
	});
});
