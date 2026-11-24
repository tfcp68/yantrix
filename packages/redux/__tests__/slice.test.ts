import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { TKeys } from '@yantrix/utils';
import { describe, expect, it } from 'vitest';
import { createFSMSlice } from '../src';
import TrafficLightAutomata from './generated/TrafficLightAutomata_generated';

describe('createFSMSlice test', () => {
	const createLightSlice = (name: string) =>
		createFSMSlice<TKeys<typeof TrafficLightAutomata.actions>, object>({ name, Fsm: TrafficLightAutomata });
	const { reducer, actions } = createLightSlice(TrafficLightAutomata.id);
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

	it('routes actions by slice name when two slices use the same FSM class', () => {
		const north = createLightSlice('north');
		const south = createLightSlice('south');
		const lights = configureStore({ reducer: { first: north.reducer, second: south.reducer } });
		const initialSouth = lights.getState().second;

		expect(north.actions.Switch.type).toBe('north/Switch');
		expect(south.actions.Switch.type).toBe('south/Switch');
		lights.dispatch(north.actions.Switch({}));
		lights.dispatch(north.actions.Switch({}));
		expect(lights.getState().first.state).toBe(getState('RedYellow'));
		expect(lights.getState().second).toBe(initialSouth);

		lights.dispatch(south.actions.Switch({}));
		expect(lights.getState().first.state).toBe(getState('RedYellow'));
		expect(lights.getState().second.state).toBe(getState('Red'));
	});

	it('routes to both reducers when both slices use the class id as their name', () => {
		const first = createLightSlice(TrafficLightAutomata.id);
		const second = createLightSlice(TrafficLightAutomata.id);
		const lights = configureStore({ reducer: { first: first.reducer, second: second.reducer } });

		expect(first.actions.Switch.type).toBe(`${TrafficLightAutomata.id}/Switch`);
		expect(second.actions.Switch.type).toBe(first.actions.Switch.type);
		lights.dispatch(first.actions.Switch({}));
		expect(lights.getState().first.state).toBe(getState('Red'));
		expect(lights.getState().second.state).toBe(getState('Red'));
	});
});
