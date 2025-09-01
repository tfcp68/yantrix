import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { TKeys } from '@yantrix/utils';
import { describe, expect, it } from 'vitest';
import { createFSMSlice } from '../src';
import TrafficLightAutomata from './fixtures/TrafficLightAutomata';

describe('createFSMSlice test', () => {
	const { reducer, actions } = createFSMSlice<TKeys<typeof TrafficLightAutomata.actions>, object>({
		name: TrafficLightAutomata.id,
		Fsm: TrafficLightAutomata,
	});
	const { getState } = TrafficLightAutomata;

	const store = configureStore({
		reducer: combineReducers({
			[TrafficLightAutomata.id]: reducer,
		}),
	});

	it('equal state', () => {
		store.dispatch(actions.Switch({}));
		const currState = store.getState()[TrafficLightAutomata.id];

		expect(currState?.state).equal(getState('Red'));
	});

	it('validate state', () => {
		const automata = new TrafficLightAutomata();
		const currState = store.getState()[TrafficLightAutomata.id]?.state;
		expect(automata.validateState(currState)).toBeTruthy();
	});
});
