import { describe, expect, test } from 'vitest';
import { createFSMSlice } from '../src/slice/slice';
import { actionsDictionary, GamePhaseAutomata, statesDictionary } from './fixtures/GamePhaseAutomata_generated';
import { combineReducers, configureStore } from '@reduxjs/toolkit';

// const fixtures

describe('createFSMSlice test', () => {
	const { actions, name, reducer } = createFSMSlice({
		name: 'game_phase',
		fsm: GamePhaseAutomata,
		actionsFSM: actionsDictionary,
		contextToRedux: (context) => ({
			context,
		}),
	});
	const store = configureStore({
		reducer: combineReducers({
			[name]: reducer,
		}),
	});

	test('equal state', () => {
		store.dispatch(actions.RESET({}));
		const currState = store.getState()[name];

		expect(currState?.state).equal(statesDictionary.INIT);
	});

	test('equal state', () => {
		const { validateState } = new GamePhaseAutomata();
		const currState = store.getState()[name]?.state;

		expect(validateState(currState)).toBeTruthy();
	});
});
