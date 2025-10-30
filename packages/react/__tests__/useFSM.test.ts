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

	it('selector in useFSM', () => {
		const { result } = renderHook(() => useFSM(TLA, {
			selector: (state) => {
				return state.context;
			},
		}));

		expect(result).toBeDefined();
	});

	it('selector: no re-render when selection is logically equal (isEqual preserves reference)', () => {
		const id = uniqId(10);
		let renders = 0;

		const { result } = renderHook(() => {
			renders += 1;
			return useFSM(
				{ Automata: TLA, id },
				{
					selector: (inst, statics) => {
						const st = inst.getContext().state;
						const red = statics.getState?.('Red');
						const redYellow = statics.getState?.('RedYellow');
						const isRedish = st === red || st === redYellow;
						return { isRedish };
					},
					isEqual: (a, b) => a.isRedish === b.isRedish,
				},
			);
		});

		expect(renders).toBe(1);

		// 1) Off -> Red (false -> true) => a re-render should occur
		act(() => {
			result.current.dispatch({
				action: TLA.getAction?.('Switch'),
				payload: {},
			});
		});
		expect(renders).toBe(2);

		// 2) Red -> RedYellow (true -> true) => with isEqual there should be no re-render
		act(() => {
			result.current.dispatch({
				action: TLA.getAction?.('Switch'),
				payload: {},
			});
		});
		expect(renders).toBe(2);

		// 3) RedYellow -> Green (true -> false) => a re-render should occur
		act(() => {
			result.current.dispatch({
				action: TLA.getAction?.('Switch'),
				payload: {},
			});
		});
		expect(renders).toBe(3);
	});

	it('selector: re-renders without isEqual when selector returns new object each time (even if logical value same)', () => {
		const id = uniqId(10);
		let renders = 0;

		const { result } = renderHook(() => {
			renders += 1;
			return useFSM(
				{ Automata: TLA, id },
				{
					selector: (inst, statics) => {
						const st = inst.getContext().state;
						const red = statics.getState?.('Red');
						const redYellow = statics.getState?.('RedYellow');
						return { isRedish: st === red || st === redYellow };
					},
					// do not pass isEqual
				},
			);
		});

		expect(renders).toBe(1);

		// Off -> Red (false -> true) => re-render
		act(() => {
			result.current.dispatch({
				action: TLA.getAction?.('Switch'),
				payload: {},
			});
		});
		expect(renders).toBe(2);

		// Red -> RedYellow (true -> true), but selector returns a new object => will re-render
		act(() => {
			result.current.dispatch({
				action: TLA.getAction?.('Switch'),
				payload: {},
			});
		});
		expect(renders).toBe(3);
	});

	it('selector: constant primitive selection prevents re-renders for subsequent FSM changes', () => {
		const id = uniqId();
		let renders = 0;

		const { result } = renderHook(() => {
			renders += 1;
			return useFSM(
				{ Automata: TLA, id },
				{
					selector: () => 42,
				},
			);
		});

		expect(renders).toBe(1);

		act(() => {
			result.current.dispatch({
				action: TLA.getAction?.('Switch'),
				payload: {},
			});
			result.current.dispatch({
				action: TLA.getAction?.('Switch'),
				payload: {},
			});
			result.current.dispatch({
				action: TLA.getAction?.('Switch'),
				payload: {},
			});
		});

		// selection unchanged => no additional re-renders
		expect(renders).toBe(1);
	});

	it('selector: primitive selection unchanged does not re-render', () => {
		const id = uniqId(10);
		let renders = 0;

		const { result } = renderHook(() => {
			renders += 1;
			return useFSM(
				{ Automata: TLA, id },
				{
					// boolean value remains true during Red -> RedYellow
					selector: (inst, statics) => {
						const state = inst.getContext().state;
						const red = statics.getState?.('Red');
						const redYellow = statics.getState?.('RedYellow');
						return state === red || state === redYellow;
					},
				},
			);
		});

		expect(renders).toBe(1);

		// Off -> Red: false -> true => re-render
		act(() => {
			result.current.dispatch({
				action: TLA.getAction?.('Switch'),
				payload: {},
			});
		});
		expect(renders).toBe(2);

		// Red -> RedYellow: true -> true => primitive unchanged => no re-render
		act(() => {
			result.current.dispatch({
				action: TLA.getAction?.('Switch'),
				payload: {},
			});
		});
		expect(renders).toBe(2);
	});

	it('selector: throws when selection returns null/undefined', () => {
		const { result } = renderHook(() =>
			useFSM(
				{ Automata: TLA, id: 'test' },
				{ selector: () => null },
			),
		);

		// The error is available as result.error
		expect(result.error).toBeInstanceOf(Error);
		expect((result.error as Error).message).toMatch(/Undefined or null selection value/);
	});
});
