import { renderHook } from '@testing-library/react-hooks';
import { uniqId } from '@yantrix/core';
import { act } from 'react';
import { assert, describe, expect, it } from 'vitest';
import { useFSM } from '../src';
import GamePhaseAutomataTest from './fixtures/GamePhaseAutomataTest';
import { TrafficLightAutomata as TLA } from './fixtures/TrafficLightAutomata';

describe('useFSM tests', () => {
	it('instance class by automata id', () => {
		renderHook(() => useFSM({
			Automata: TLA,
			id: TLA.id,
		}));

		const { result: FSM2 } = renderHook(() => useFSM({
			Automata: GamePhaseAutomataTest,
			id: TLA.id,
		}));

		expect(FSM2.current.getInstanceAutomata()).toBeInstanceOf(TLA);
	});

	it('change state after action', async () => {
		const { result } = renderHook(() => useFSM({
			Automata: TLA,
			id: uniqId(10),
		}));
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
		const { result } = renderHook(() => useFSM({
			Automata: TLA,
			id: uniqId(10),
		}));

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

	it('check singleton', () => {
		const { result: FSM1 } = renderHook(() => useFSM(TLA));

		const { result: FSM2 } = renderHook(() => useFSM(GamePhaseAutomataTest));

		assert.notDeepEqual(FSM1.current.getInstanceAutomata(), FSM2.current.getInstanceAutomata());
		expect(FSM1.current.getInstanceAutomata()).toBeInstanceOf(TLA);
		expect(FSM2.current.getInstanceAutomata()).toBeInstanceOf(GamePhaseAutomataTest);
	});

	it('does not re-render when dispatch results in the same state and context (isEqual guards)', () => {
		const id = uniqId(10);
		let renders = 0;

		const { result } = renderHook(() => {
			renders++;
			return useFSM(
				{ Automata: TLA, id },
			);
		});

		expect(renders).toBe(1);
		expect(result.current.state).toBe(TLA.getState?.('Off'));

		act(() => {
			result.current.dispatch({
				action: TLA.getAction?.('Reset'),
				payload: {
					initialCounter: 0,
				},
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
