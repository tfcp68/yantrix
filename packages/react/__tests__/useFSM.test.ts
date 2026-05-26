import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { assert, describe, expect, it } from 'vitest';
import { useFSM } from '../src';
import GamePhaseAutomataTest from './generated/GamePhaseAutomataTest_generated';
import { TrafficLightAutomata as TLA } from './generated/TrafficLightAutomata_generated';

describe('useFSM tests', () => {
	it('same instance reuses the same store', () => {
		const inst = new TLA();
		const { result: FSM1 } = renderHook(() => useFSM(inst));
		const { result: FSM2 } = renderHook(() => useFSM(inst));

		expect(FSM1.current.getInstanceAutomata().Automata).toBe(inst);
		expect(FSM2.current.getInstanceAutomata().Automata).toBe(inst);
		expect(FSM1.current.getInstanceAutomata().id).toBe(FSM2.current.getInstanceAutomata().id);
	});

	it('change state after action', async () => {
		const inst = new TLA();
		const { result } = renderHook(() => useFSM(inst));
		act(() => {
			result.current.dispatch({
				action: TLA.getAction?.('Switch'),
				payload: {},
			});
			result.current.dispatch({
				action: TLA.getAction?.('Switch'),
				payload: {},
			});

			expect(result.current.getContext().state).equal(result.current.getState?.('RedYellow'));
		});
	});

	it('trace previous context', () => {
		const inst = new TLA();
		const { result } = renderHook(() => useFSM(inst));

		act(() => {
			result.current.dispatch({
				action: result.current.getAction?.('Switch'),
				payload: {},
			});
			result.current.dispatch({
				action: result.current.getAction?.('Switch'),
				payload: {},
			});
		});

		expect(result.current.trace().previousContext.state).equal(result.current.getState?.('Red'));
	});

	it('different instances have isolated automata', () => {
		const inst1 = new TLA();
		const inst2 = new GamePhaseAutomataTest();
		const { result: FSM1 } = renderHook(() => useFSM(inst1));
		const { result: FSM2 } = renderHook(() => useFSM(inst2));

		assert.notDeepEqual(FSM1.current.getInstanceAutomata(), FSM2.current.getInstanceAutomata());
		expect(FSM1.current.getInstanceAutomata().Automata).toBeInstanceOf(TLA);
		expect(FSM2.current.getInstanceAutomata().Automata).toBeInstanceOf(GamePhaseAutomataTest);
	});

	it('does not re-render when dispatch results in the same state and context (isEqual guards)', () => {
		let renders = 0;
		const inst = new TLA();

		const { result } = renderHook(() => {
			renders++;
			return useFSM(inst);
		});

		expect(renders).toBe(1);
		expect(result.current.state).toBe(TLA.getState?.('Off'));

		act(() => {
			result.current.dispatch({
				action: TLA.getAction?.('Reset'),
				payload: { initialCounter: 0 },
			});
		});

		expect(renders).toBe(1);
		const afterNoop = result.current.state;
		expect(afterNoop).toBe(TLA.getState?.('Off'));

		act(() => {
			result.current.dispatch({
				action: TLA.getAction?.('Switch'),
				payload: {},
			});
		});
		expect(renders).toBe(2);
		const afterChange = result.current.state;
		expect(afterChange).toBe(TLA.getState?.('Red'));
	});
});
