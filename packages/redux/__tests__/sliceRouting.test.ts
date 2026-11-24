import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { describe, expect, it, vi } from 'vitest';
import { createFSMSlice } from '../src';
import TrafficLight from './generated/TrafficLightAutomata_generated';

const createLight = (name?: string, Fsm = TrafficLight) =>
	createFSMSlice<keyof typeof TrafficLight.actions, object>({ Fsm, name });

describe('slice routing names', () => {
	it('uses the constructed machine correlationId for omitted and empty names', () => {
		const created: string[] = [];
		class ObservedLight extends TrafficLight {
			static override id = TrafficLight.id;
			constructor() {
				super();
				created.push(this.correlationId);
			}
		}

		const first = createLight(undefined, ObservedLight);
		const second = createLight('', ObservedLight);
		expect([first.name, second.name]).toEqual(created);
		expect(first.name).not.toBe(second.name);
		expect(first.reducerPath).toBe(first.name);
		expect(first.actions.Switch.type).toBe(`${first.name}/Switch`);

		const store = configureStore({ reducer: { [first.name]: first.reducer, [second.name]: second.reducer } });
		const secondInitialState = second.selectSlice(store.getState());
		store.dispatch(first.actions.Switch({}));
		expect(first.selectSlice(store.getState()).state).toBe(TrafficLight.getState('Red'));
		expect(second.selectSlice(store.getState())).toBe(secondInitialState);
	});

	it('warns on collision in one store while preserving both explicit action routes', () => {
		const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
		try {
			const first = createLight('__proto__');
			const second = createLight('__proto__');
			const store = configureStore({ reducer: { first: first.reducer, second: second.reducer } });
			expect(warning).toHaveBeenCalledTimes(1);
			expect(warning).toHaveBeenCalledWith(expect.stringContaining('"__proto__"'));
			store.dispatch(first.actions.Switch({}));
			expect(store.getState().first.state).toBe(TrafficLight.getState('Red'));
			expect(store.getState().second.state).toBe(TrafficLight.getState('Red'));
			expect(warning).toHaveBeenCalledTimes(1);
		} finally {
			warning.mockRestore();
		}
	});

	it('allows the same name across stores and checks newly mounted reducers on replacement', () => {
		const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
		try {
			const north = createLight('lights');
			const south = createLight('lights');
			const unrelated = createLight('other');
			const store = configureStore({ reducer: { first: north.reducer, second: unrelated.reducer } });
			configureStore({ reducer: { first: south.reducer } });
			expect(warning).not.toHaveBeenCalled();
			store.replaceReducer(combineReducers({ first: north.reducer, second: south.reducer }));
			expect(warning).toHaveBeenCalledTimes(1);
		} finally {
			warning.mockRestore();
		}
	});
});
