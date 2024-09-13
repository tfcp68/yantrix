import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';
import { createFSMSlice } from '../src/slice/slice';
import GamePhaseTest from './fixtures/GamePhaseAutomataTest';

describe('createFSMSlice test', () => {
	const { actions, name, reducer } = createFSMSlice({
		name: GamePhaseTest.id,
		Fsm: GamePhaseTest,
	});
	const { states, getState } = GamePhaseTest;

	const store = configureStore({
		reducer: combineReducers({
			[name]: reducer,
		}),
	});

	it('equal state', () => {
		store.dispatch(actions.RESET({}));
		const currState = store.getState()[name];

		expect(currState?.state).equal(getState(states.INIT));
	});

	it('validate state', () => {
		const { validateState } = new GamePhaseTest();
		const currState = store.getState()[name]?.state;

		expect(validateState(currState)).toBeTruthy();
	});
});
