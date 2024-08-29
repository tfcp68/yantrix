import { describe, expect, test } from 'vitest';
import { createFSMSlice } from '../src/slice/slice';
import { GamePhaseAutomata } from './fixtures/GamePhaseAutomata_generated';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import GamePhaseTest from './fixtures/GamePhaseAutomataTest_generated';

describe('createFSMSlice test', () => {
	const { actions, name, reducer } = createFSMSlice({
		name: GamePhaseTest.id,
		fsm: GamePhaseTest,
		contextToRedux: (context) => ({
			context,
		}),
	});
	const { states, getState } = GamePhaseTest;

	const store = configureStore({
		reducer: combineReducers({
			[name]: reducer,
		}),
	});

	test('equal state', () => {
		store.dispatch(actions.RESET({}));
		const currState = store.getState()[name];

		expect(currState?.state).equal(getState(states.INIT));
	});

	test('validate state', () => {
		const { validateState } = new GamePhaseAutomata();
		const currState = store.getState()[name]?.state;

		expect(validateState(currState)).toBeTruthy();
	});
});
