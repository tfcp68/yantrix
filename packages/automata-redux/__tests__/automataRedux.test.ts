import { combineReducers, configureStore, createSlice } from '@reduxjs/toolkit';
import { actionsDictionary, GamePhaseAutomata } from './GamePhaseAutomata_generated.js';
import { DispatchFromFSMToReduxGenerator, getAutomataWithReduxDispatch } from '../src/index.js';
import { describe, expect, test, beforeEach } from 'vitest';

describe('dispatchFromFSM', () => {
	const reducerInitialState = {
		players: 0,
		score: 0,
		callCount: 0,
	};
	const testReducer = createSlice({
		name: 'testReducer',
		initialState: reducerInitialState,
		reducers: {
			dispatchFromFSM(state, action) {
				state.callCount += 1;
				state.players = action.payload.players;
				state.score += action.payload.score;
				return state;
			},
			resetState(state) {
				state = reducerInitialState;
				return state;
			},
		},
	});

	const rootReducer = combineReducers({
		testReducer: testReducer.reducer,
	});

	const store = configureStore({
		reducer: rootReducer,
		middleware: (gDM) =>
			gDM().concat(() => {
				return (next) => (action) => {
					return next(action);
				};
			}),
	});

	const dispatchFromFSM = DispatchFromFSMToReduxGenerator({
		reduxDispatch: store.dispatch,
		reduxActionGenerator: (actionFromFSM) => {
			return {
				type: 'testReducer/dispatchFromFSM',
				payload: actionFromFSM.payload,
			};
		},
	});

	const Automata = getAutomataWithReduxDispatch({
		Automata: GamePhaseAutomata,
		dispatchFromFSMToRedux: dispatchFromFSM,
	});

	let automata = new Automata();
	beforeEach(() => {
		automata = new Automata();
		store.dispatch(testReducer.actions.resetState());
	});

	test('should save state in redux', () => {
		automata.dispatch({
			action: actionsDictionary['/RESET'],
			payload: {
				players: 3,
				score: 0,
			},
		});
		expect(automata.context).deep.equal({
			players: 3,
			score: 0,
		});
		expect(store.getState()).deep.equal({
			testReducer: {
				players: 3,
				score: 0,
				callCount: 1,
			},
		});
	});

	test("should't save state in redux via error action", () => {
		try {
			automata.dispatch({
				action: -1,
				payload: {
					players: 3,
					score: 0,
				},
			});
		} catch (e) {}
		expect(automata.context).deep.equal({
			players: 0,
			score: 0,
		});
		expect(store.getState()).deep.equal({
			testReducer: {
				players: 0,
				score: 0,
				callCount: 0,
			},
		});
	});

	test('should save actual state in redux via early action', () => {
		automata.dispatch({
			action: actionsDictionary['/TO_MENU'],
			payload: {
				players: 3,
				score: 0,
			},
		});

		expect(automata.context).deep.equal({
			players: 3,
			score: 0,
		});
		expect(store.getState()).deep.equal({
			testReducer: {
				players: 3,
				score: 0,
				callCount: 1,
			},
		});
	});
});
