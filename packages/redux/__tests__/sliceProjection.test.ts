import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it, vi } from 'vitest';
import { createFSMSlice } from '../src';
import TrafficLight from './generated/TrafficLightAutomata_generated';

type TLightAction = keyof typeof TrafficLight.actions;
type TLightContext = { counter: number | null };

describe('createFSMSlice state projection', () => {
	it('stores the initial snapshot and reads current context on every dispatch', () => {
		const slice = createFSMSlice<TLightAction, TLightContext>({ Fsm: TrafficLight, name: 'projection-default' });
		const store = configureStore({ reducer: slice.reducer });
		const reference = new TrafficLight();

		expect(store.getState()).toEqual(reference.getContext());
		store.dispatch(slice.actions.Switch({}));
		reference.dispatch(TrafficLight.createAction('Switch', {}));
		const first = store.getState();
		expect(first).toEqual(reference.getContext());
		expect(first.context.counter).toBe(1);

		store.dispatch(slice.actions.Switch({}));
		reference.dispatch(TrafficLight.createAction('Switch', {}));
		expect(store.getState()).toEqual(reference.getContext());
		expect(store.getState().context.counter).toBe(2);
		expect(first.context.counter).toBe(1);
	});

	it('passes the same snapshot shape to the mapper at initialization and on updates', () => {
		const observe = vi.fn();
		const slice = createFSMSlice<TLightAction, { count: number | null }>({
			Fsm: TrafficLight,
			name: 'projection-mapped',
			contextToRedux: (input) => {
				observe(input.state, input.context.counter, input.counter);
				return { count: input.context.counter };
			},
		});
		const store = configureStore({ reducer: slice.reducer });
		const initial = new TrafficLight().getContext().context.counter;
		expect(store.getState()).toEqual({ state: TrafficLight.getState('Off'), context: { count: initial } });

		store.dispatch(slice.actions.Switch({}));
		store.dispatch({ type: 'other' });
		expect(observe.mock.calls).toEqual([
			[TrafficLight.getState('Off'), initial, initial],
			[TrafficLight.getState('Red'), 1, 1],
		]);
		expect(store.getState()).toEqual({ state: TrafficLight.getState('Red'), context: { count: 1 } });
	});

	it('keeps the top-level machine context independent of the Redux snapshot', () => {
		const getContext = vi.spyOn(TrafficLight.prototype, 'getContext');
		const slice = createFSMSlice<TLightAction, TLightContext>({ Fsm: TrafficLight, name: 'projection-owned' });
		const light = getContext.mock.contexts[0] as TrafficLight;
		getContext.mockRestore();
		const store = configureStore({ reducer: slice.reducer });
		expect(store.getState().context).not.toBe(light.getContext().context);
		expect(Object.isFrozen(light.getContext().context)).toBe(false);
		store.dispatch(slice.actions.Switch({}));
		expect(store.getState().context).not.toBe(light.getContext().context);
		expect(Object.isFrozen(light.getContext().context)).toBe(false);
	});

	it('keeps reserved raw fields accessible in the nested context', () => {
		class ReservedFieldsLight extends TrafficLight {
			constructor() {
				super();
				this.setContext({ state: this.state, context: { state: 'raw state', context: 'raw context' } });
			}
		}
		const slice = createFSMSlice({
			Fsm: ReservedFieldsLight,
			name: 'projection-reserved',
			contextToRedux: ({ state, context }) => ({ machineState: state, raw: context }),
		});
		const snapshot = slice.getInitialState();
		expect(snapshot.context).toEqual({
			machineState: snapshot.state,
			raw: { state: 'raw state', context: 'raw context' },
		});
	});
});
