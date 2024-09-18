import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';
import { createFSMSlice, TKeys } from '../src';
import TrafficLightAutomata from './fixtures/TrafficLightAutomata';

describe('createFSMSlice test', () => {
	const { name, reducer, actions } = createFSMSlice<TKeys<typeof TrafficLightAutomata.actions>, object>({
		name: TrafficLightAutomata.id,
		Fsm: TrafficLightAutomata,
	});
	const { states, getState } = TrafficLightAutomata;

	const store = configureStore({
		reducer: combineReducers({
			[name]: reducer,
		}),
	});

	it('equal state', () => {
		store.dispatch(actions.Switch({}));
		const currState = store.getState()[name];

		expect(currState?.state).equal(getState(states.Red));
	});

	it('validate state', () => {
		const { validateState } = new TrafficLightAutomata();
		const currState = store.getState()[name]?.state;

		expect(validateState(currState)).toBeTruthy();
	});
});
