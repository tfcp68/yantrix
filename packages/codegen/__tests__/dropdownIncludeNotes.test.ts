import { beforeEach, describe, expect, test, vitest } from 'vitest';
import { actionsDictionary, DropdownAutomata, statesDictionary } from './fixtures/DropDownAutomata_generated.js';

let automata: DropdownAutomata;

/*
`stateDiagram-v2
[*] --> CLOSED: RESET (list)
note left of [*]
+INITIAL
#{ items = []}
#{ selectedIndex = 0 }
end note
CLOSED --> OPEN: OPEN
OPEN --> CLOSED: CLOSE
OPEN --> SELECTED: SELECT (index)
SELECTED --> CLOSED: CLOSE
note left of CLOSED
#{ items } <= (list)
#{ selectedIndex = 0 } <= {index}
subscribe/click => OPEN
emit/dropdownClose
end note
note left of SELECTED
#{ selectedIndex } <= (index)
emit/selected <= (index)
subscribe/selected => CLOSE
end note
note right of OPEN
emit/dropdownOpen
subscribe/click => SELECT (index)
subscribe/clickOutside => CLOSE
end note
`
 */

describe('Codegen output', () => {
	describe('Dropdown', () => {
		const toClosed = [{ action: actionsDictionary['/RESET (list)'], payload: { list: [1, 2, 3] } }];
		const toOpen = [...toClosed, { action: actionsDictionary['/OPEN'], payload: {} }];
		const toSelected = [...toOpen, { action: actionsDictionary['/SELECT (index)'], payload: { index: 2 } }];

		beforeEach(() => {
			vitest.clearAllTimers();
			vitest.clearAllTimers();
			automata = new DropdownAutomata();
		});
		test('Initial state', () => {
			expect(automata.state).toBe(statesDictionary['/~~~START~~~']);
		});
		test('Initial context', () => {
			expect(automata.context).toStrictEqual({
				items: [],
				selectedIndex: 0,
			});
		});
		test('[*] --> CLOSED: RESET (list)', () => {
			automata.dispatch(toClosed[0]);
			expect(automata.state).toBe(statesDictionary['/CLOSED']);
			expect(automata.context).toStrictEqual({
				items: [1, 2, 3],
				selectedIndex: 0,
			});
		});
		test('CLOSED --> OPEN: OPEN', () => {
			automata.setActionQueue([...toOpen]);
			automata.consumeAction(toOpen.length);

			expect(automata.context).toBeNull();
		});
		test('OPEN --> CLOSED: CLOSE', () => {
			automata.setActionQueue([...toClosed]);
			automata.consumeAction(toClosed.length);
			expect(automata.state).toBe(statesDictionary['/CLOSED']);
			expect(automata.context).toStrictEqual({
				items: [1, 2, 3],
				selectedIndex: 0,
			});
		});
		test('OPEN --> SELECTED: SELECT (index)', () => {
			automata.setActionQueue([...toSelected]);
			automata.consumeAction(toSelected.length);
			expect(automata.state).toBe(statesDictionary['/SELECTED']);
		});
	});
});
