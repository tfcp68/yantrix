import { configureStore, createAction, UnknownAction } from '@reduxjs/toolkit';
import { describe, expect, it, vi } from 'vitest';
import { createMiddleware } from '../src/index.js';
import TrafficLight from './generated/TrafficLightAutomata_generated.js';

const switchLight = createAction('lights/switch');
const changed = createAction<number | null>('lights/changed');
const unrelated = createAction('other/action');
const toFSM = (action: UnknownAction) => switchLight.match(action) ? TrafficLight.createAction('Switch', {}) : null;

function makeStore(middleware: ReturnType<typeof createMiddleware>) {
	return configureStore({
		reducer: (state: UnknownAction[] = [], action) => action.type.startsWith('@@redux/') ? state : [...state, action],
		middleware: getDefaultMiddleware => getDefaultMiddleware().concat(middleware),
	});
}

describe('createMiddleware', () => {
	it('forwards unmatched actions unchanged and projects matched FSM state to Redux', () => {
		const mapContext = vi.fn(({ state }: ReturnType<TrafficLight['getContext']>) => changed(state));
		const store = makeStore(createMiddleware(TrafficLight, toFSM, mapContext));
		const other = unrelated();

		expect(store.dispatch(other)).toBe(other);
		expect(store.getState()).toEqual([other]);
		expect(mapContext).not.toHaveBeenCalled();

		store.dispatch(switchLight());
		expect(mapContext).toHaveBeenCalledOnce();
		expect(store.getState()).toEqual([other, changed(TrafficLight.getState('Red'))]);
	});

	it('accepts a null outbound mapping', () => {
		const store = makeStore(createMiddleware(TrafficLight, toFSM, () => null));
		store.dispatch(switchLight());
		expect(store.getState()).toEqual([]);
	});

	it('isolates machine state when the same middleware is installed in two stores', () => {
		const middleware = createMiddleware(TrafficLight, toFSM, ({ state }) => changed(state));
		const first = makeStore(middleware);
		const second = makeStore(middleware);

		first.dispatch(switchLight());
		first.dispatch(switchLight());
		second.dispatch(switchLight());
		expect(first.getState().at(-1)).toEqual(changed(TrafficLight.getState('RedYellow')));
		expect(second.getState().at(-1)).toEqual(changed(TrafficLight.getState('Red')));
	});
});
