import { renderHook } from '@testing-library/react-hooks';
import { uniqId } from '@yantrix/core';
import { act } from 'react';
import { describe, expect, it } from 'vitest';
import { useFSMWithSelector } from '../src/hooks/useFSMWithSelector';
import { TrafficLightAutomata as TLA } from './generated/TrafficLightAutomata';
import TrafficLightAutomataTwoCounters from './generated/TrafficLightAutomataTwoCounters';

describe('useFSMWithSelector tests (selector-based hook)', () => {
	it('basic selector returns context', () => {
		const { result } = renderHook(() => useFSMWithSelector(TLA, {
			selector: inst => inst.getContext().context,
		}));

		expect(result.current.selection).toBeDefined();
	});

	it('selection reference is preserved when logically equal (isEqual preserves reference)', () => {
		const id = uniqId(10);

		const { result } = renderHook(() =>
			useFSMWithSelector(
				{ Automata: TLA, id },
				{
					selector: (inst, statics) => {
						const st = inst.getContext().state;
						const red = statics.getState?.('Red');
						const redYellow = statics.getState?.('RedYellow');
						return { isRedish: st === red || st === redYellow };
					},
					isEqual: (a, b) => a.isRedish === b.isRedish,
				},
			),
		);

		// Initial selection
		const sel0 = result.current.selection;
		expect(sel0.isRedish).toBe(false);

		// Off -> Red (false -> true): selection should change (new reference)
		act(() => {
			result.current.dispatch({ action: TLA.getAction?.('Switch'), payload: {} });
		});
		const sel1 = result.current.selection;
		expect(sel1.isRedish).toBe(true);
		expect(sel1).not.toBe(sel0);

		// Red -> RedYellow (true -> true): logically equal, reference should be preserved
		act(() => {
			result.current.dispatch({ action: TLA.getAction?.('Switch'), payload: {} });
		});
		const sel2 = result.current.selection;
		expect(sel2.isRedish).toBe(true);
		expect(sel2).toBe(sel1);

		// RedYellow -> Green (true -> false): selection should change (new reference)
		act(() => {
			result.current.dispatch({ action: TLA.getAction?.('Switch'), payload: {} });
		});
		const sel3 = result.current.selection;
		expect(sel3.isRedish).toBe(false);
		expect(sel3).not.toBe(sel2);
	});

	it('without isEqual, selection reference changes even if logical value stays same', () => {
		const id = uniqId(10);

		const { result } = renderHook(() =>
			useFSMWithSelector(
				{ Automata: TLA, id },
				{
					selector: (inst, statics) => {
						const st = inst.getContext().state;
						const red = statics.getState?.('Red');
						const redYellow = statics.getState?.('RedYellow');
						return { isRedish: st === red || st === redYellow };
					},
				},
			),
		);

		// Initial selection
		const sel0 = result.current.selection;
		expect(sel0.isRedish).toBe(false);

		// Off -> Red (false -> true): selection changes (new reference)
		act(() => {
			result.current.dispatch({ action: TLA.getAction?.('Switch'), payload: {} });
		});
		const sel1 = result.current.selection;
		expect(sel1.isRedish).toBe(true);
		expect(sel1).not.toBe(sel0);

		// Red -> RedYellow (true -> true): selector returns a new object -> reference changes
		act(() => {
			result.current.dispatch({ action: TLA.getAction?.('Switch'), payload: {} });
		});
		const sel2 = result.current.selection;
		expect(sel2.isRedish).toBe(true);
		expect(sel2).not.toBe(sel1);
	});

	it('constant primitive selection keeps the same value across transitions', () => {
		const id = uniqId();

		const { result } = renderHook(() =>
			useFSMWithSelector(
				{ Automata: TLA, id },
				{
					selector: () => 42,
				},
			),
		);

		expect(result.current.selection).toBe(42);

		act(() => {
			result.current.dispatch({ action: TLA.getAction?.('Switch'), payload: {} });
			result.current.dispatch({ action: TLA.getAction?.('Switch'), payload: {} });
			result.current.dispatch({ action: TLA.getAction?.('Switch'), payload: {} });
		});

		expect(result.current.selection).toBe(42);
	});

	it('primitive boolean selection remains true for Red -> RedYellow', () => {
		const id = uniqId(10);

		const { result } = renderHook(() =>
			useFSMWithSelector(
				{ Automata: TLA, id },
				{
					selector: (inst, statics) => {
						const state = inst.getContext().state;
						const red = statics.getState?.('Red');
						const redYellow = statics.getState?.('RedYellow');
						return state === red || state === redYellow;
					},
				},
			),
		);

		// Off -> Red: false -> true
		expect(result.current.selection).toBe(false);
		act(() => {
			result.current.dispatch({ action: TLA.getAction?.('Switch'), payload: {} });
		});
		expect(result.current.selection).toBe(true);

		// Red -> RedYellow: true -> true (value stays true)
		act(() => {
			result.current.dispatch({ action: TLA.getAction?.('Switch'), payload: {} });
		});
		expect(result.current.selection).toBe(true);
	});

	it('selector: throws when selection returns null/undefined', () => {
		const { result } = renderHook(() =>
			useFSMWithSelector(
				{ Automata: TLA, id: 'test' },
				{ selector: () => null },
			),
		);

		// The error is available as result.error
		expect(result.error).toBeInstanceOf(Error);
		expect((result.error as Error).message).toMatch(/Undefined or null selection value/);
	});
});

describe.skip('selective re-render with second counter', () => {
	it('selector: context.counter — Switch_1 after first Switch does not trigger re-render', () => {
		let renders = 0;

		const { result } = renderHook(() => {
			renders++;
			return useFSMWithSelector(TrafficLightAutomataTwoCounters, {
				selector: inst => inst.getContext().context.counter,
			});
		});

		// Initial state Off
		const initial = result.current.selection;
		expect(renders).toBe(1);

		// 1. Switch (Off -> Red) — should increment counter
		act(() => {
			result.current.dispatch({
				action: TrafficLightAutomataTwoCounters.getAction('Switch'),
				payload: {},
			});
		});

		expect(result.current.selection).toBe(initial + 1);
		expect(renders).toBe(2);

		const afterFirstSwitch = result.current.selection;

		// 2. Switch_1 (Red -> Red self-loop) — only counter2 changes; counter must remain unchanged
		act(() => {
			result.current.dispatch({
				action: TrafficLightAutomataTwoCounters.getAction('Switch_1'),
				payload: {},
			});
		});

		// No change -> no re-render
		expect(result.current.selection).toBe(afterFirstSwitch);
		expect(renders).toBe(2);

		// 3. Another Switch (Red -> RedYellow) — counter increments again
		act(() => {
			result.current.dispatch({
				action: TrafficLightAutomataTwoCounters.getAction('Switch'),
				payload: {},
			});
		});

		expect(result.current.selection).toBe(afterFirstSwitch + 1);
		expect(renders).toBe(3);
	});

	it('selector: context.counter2 — reacts only to Switch_1; Switch does not trigger re-render', () => {
		let renders = 0;

		const { result } = renderHook(() => {
			renders++;
			return useFSMWithSelector(TrafficLightAutomataTwoCounters, {
				selector: inst => inst.getContext().context.counter2,
			});
		});

		const initial2 = result.current.selection;
		expect(renders).toBe(1);

		// 1. Switch (Off -> Red): only counter changes; counter2 stays the same
		act(() => {
			result.current.dispatch({
				action: TrafficLightAutomataTwoCounters.getAction('Switch'),
				payload: {},
			});
		});

		// No change -> still first render
		expect(result.current.selection).toBe(initial2);
		expect(renders).toBe(1);

		// 2. Switch_1 (Red -> Red): counter2 increments
		act(() => {
			result.current.dispatch({
				action: TrafficLightAutomataTwoCounters.getAction('Switch_1'),
				payload: {},
			});
		});

		expect(result.current.selection).toBe(initial2 + 1);
		expect(renders).toBe(2);

		// 3. Switch (Red -> RedYellow): counter2 unchanged
		act(() => {
			result.current.dispatch({
				action: TrafficLightAutomataTwoCounters.getAction('Switch'),
				payload: {},
			});
		});

		expect(result.current.selection).toBe(initial2 + 1);
		expect(renders).toBe(2);

		// 4. Switch_1 (RedYellow -> RedYellow): counter2 increments again
		act(() => {
			result.current.dispatch({
				action: TrafficLightAutomataTwoCounters.getAction('Switch_1'),
				payload: {},
			});
		});

		expect(result.current.selection).toBe(initial2 + 2);
		expect(renders).toBe(3);
	});
});
