import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useFSMWithSelector } from '../src/hooks/useFSMWithSelector';
import { TrafficLightAutomata as TLA } from './generated/TrafficLightAutomata_generated';
import TrafficLightAutomataTwoCounters from './generated/TrafficLightAutomataTwoCounters_generated';

describe('useFSMWithSelector tests (selector-based hook)', () => {
	it('basic selector returns context', () => {
		const inst = new TLA();
		const { result } = renderHook(() => useFSMWithSelector(inst, {
			selector: i => i.getContext().context,
		}));

		expect(result.current.selection).toBeDefined();
	});

	it('selection reference is preserved when logically equal (isEqual preserves reference)', () => {
		const inst = new TLA();

		const { result } = renderHook(() =>
			useFSMWithSelector(
				inst,
				{
					selector: (i, statics) => {
						const st = i.getContext().state;
						const red = statics.getState?.('Red');
						const redYellow = statics.getState?.('RedYellow');
						return { isRedish: st === red || st === redYellow };
					},
					isEqual: (a, b) => a.isRedish === b.isRedish,
				},
			),
		);

		const sel0 = result.current.selection;
		expect(sel0.isRedish).toBe(false);

		act(() => {
			result.current.dispatch({ action: TLA.getAction?.('Switch'), payload: {} });
		});
		const sel1 = result.current.selection;
		expect(sel1.isRedish).toBe(true);
		expect(sel1).not.toBe(sel0);

		act(() => {
			result.current.dispatch({ action: TLA.getAction?.('Switch'), payload: {} });
		});
		const sel2 = result.current.selection;
		expect(sel2.isRedish).toBe(true);
		expect(sel2).toBe(sel1);

		act(() => {
			result.current.dispatch({ action: TLA.getAction?.('Switch'), payload: {} });
		});
		const sel3 = result.current.selection;
		expect(sel3.isRedish).toBe(false);
		expect(sel3).not.toBe(sel2);
	});

	it('without isEqual, selection reference changes even if logical value stays same', () => {
		const inst = new TLA();

		const { result } = renderHook(() =>
			useFSMWithSelector(
				inst,
				{
					selector: (i, statics) => {
						const st = i.getContext().state;
						const red = statics.getState?.('Red');
						const redYellow = statics.getState?.('RedYellow');
						return { isRedish: st === red || st === redYellow };
					},
				},
			),
		);

		const sel0 = result.current.selection;
		expect(sel0.isRedish).toBe(false);

		act(() => {
			result.current.dispatch({ action: TLA.getAction?.('Switch'), payload: {} });
		});
		const sel1 = result.current.selection;
		expect(sel1.isRedish).toBe(true);
		expect(sel1).not.toBe(sel0);

		act(() => {
			result.current.dispatch({ action: TLA.getAction?.('Switch'), payload: {} });
		});
		const sel2 = result.current.selection;
		expect(sel2.isRedish).toBe(true);
		expect(sel2).not.toBe(sel1);
	});

	it('constant primitive selection keeps the same value across transitions', () => {
		const inst = new TLA();

		const { result } = renderHook(() =>
			useFSMWithSelector(inst, { selector: () => 42 }),
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
		const inst = new TLA();

		const { result } = renderHook(() =>
			useFSMWithSelector(
				inst,
				{
					selector: (i, statics) => {
						const state = i.getContext().state;
						const red = statics.getState?.('Red');
						const redYellow = statics.getState?.('RedYellow');
						return state === red || state === redYellow;
					},
				},
			),
		);

		expect(result.current.selection).toBe(false);
		act(() => {
			result.current.dispatch({ action: TLA.getAction?.('Switch'), payload: {} });
		});
		expect(result.current.selection).toBe(true);

		act(() => {
			result.current.dispatch({ action: TLA.getAction?.('Switch'), payload: {} });
		});
		expect(result.current.selection).toBe(true);
	});

	it('selector: throws when selection returns null/undefined', () => {
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		try {
			const inst = new TLA();
			expect(() =>
				renderHook(() =>
					useFSMWithSelector(inst, { selector: () => null }),
				),
			).toThrow(/Undefined or null selection value/);
		} finally {
			spy.mockRestore();
		}
	});
});

describe.skip('selective re-render with second counter', () => {
	it('selector: context.counter — Switch_1 after first Switch does not trigger re-render', () => {
		let renders = 0;
		const inst = new TrafficLightAutomataTwoCounters();

		const { result } = renderHook(() => {
			renders++;
			return useFSMWithSelector(inst, {
				selector: i => i.getContext().context.counter,
			});
		});

		const initial = result.current.selection;
		expect(renders).toBe(1);

		act(() => {
			result.current.dispatch({
				action: TrafficLightAutomataTwoCounters.getAction('Switch'),
				payload: {},
			});
		});

		expect(result.current.selection).toBe(initial + 1);
		expect(renders).toBe(2);

		const afterFirstSwitch = result.current.selection;

		act(() => {
			result.current.dispatch({
				action: TrafficLightAutomataTwoCounters.getAction('Switch_1'),
				payload: {},
			});
		});

		expect(result.current.selection).toBe(afterFirstSwitch);
		expect(renders).toBe(2);

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
		const inst = new TrafficLightAutomataTwoCounters();

		const { result } = renderHook(() => {
			renders++;
			return useFSMWithSelector(inst, {
				selector: i => i.getContext().context.counter2,
			});
		});

		const initial2 = result.current.selection;
		expect(renders).toBe(1);

		act(() => {
			result.current.dispatch({
				action: TrafficLightAutomataTwoCounters.getAction('Switch'),
				payload: {},
			});
		});

		expect(result.current.selection).toBe(initial2);
		expect(renders).toBe(1);

		act(() => {
			result.current.dispatch({
				action: TrafficLightAutomataTwoCounters.getAction('Switch_1'),
				payload: {},
			});
		});

		expect(result.current.selection).toBe(initial2 + 1);
		expect(renders).toBe(2);

		act(() => {
			result.current.dispatch({
				action: TrafficLightAutomataTwoCounters.getAction('Switch'),
				payload: {},
			});
		});

		expect(result.current.selection).toBe(initial2 + 1);
		expect(renders).toBe(2);

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
