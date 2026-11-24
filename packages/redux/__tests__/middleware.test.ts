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
	it('forwards unmatched actions unchanged and delivers a matched action before its projection', () => {
		const mapContext = vi.fn(({ state }: ReturnType<TrafficLight['getContext']>) => changed(state));
		const store = makeStore(createMiddleware(TrafficLight, toFSM, mapContext));
		const other = unrelated();

		expect(store.dispatch(other)).toBe(other);
		expect(store.getState()).toEqual([other]);
		expect(mapContext).not.toHaveBeenCalled();

		const original = switchLight();
		expect(store.dispatch(original)).toBe(original);
		expect(mapContext).toHaveBeenCalledOnce();
		expect(store.getState()).toEqual([other, original, changed(TrafficLight.getState('Red'))]);
	});

	it('delivers the original action when the outbound mapper returns null', () => {
		const store = makeStore(createMiddleware(TrafficLight, toFSM, () => null));
		const original = switchLight();
		expect(store.dispatch(original)).toBe(original);
		expect(store.getState()).toEqual([original]);
	});

	it('returns the downstream result for the original action', () => {
		const store = configureStore({ reducer: (state = 0) => state });
		const middleware = createMiddleware(TrafficLight, toFSM, ({ state }) => changed(state));
		const original = switchLight();
		const originalResult = Symbol('original');
		const next = vi.fn((action: unknown) => action === original ? originalResult : Symbol('other'));

		expect(middleware(store)(next)(original)).toBe(originalResult);
		expect(next.mock.calls).toEqual([[original], [changed(TrafficLight.getState('Red'))]]);
	});

	it('passes non-action inputs and their downstream results through without mapping', () => {
		const store = configureStore({ reducer: (state = 0) => state });
		const mapInput = vi.fn(toFSM);
		const middleware = createMiddleware(TrafficLight, mapInput, () => null);
		const thunk = () => 42;
		const next = vi.fn(() => 42);

		expect(middleware(store)(next)(thunk)).toBe(42);
		expect(next.mock.calls).toEqual([[thunk]]);
		expect(mapInput).not.toHaveBeenCalled();
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
