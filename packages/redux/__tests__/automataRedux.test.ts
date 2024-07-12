import { combineReducers, configureStore, createSlice } from '@reduxjs/toolkit';
import { actionsDictionary, GamePhaseAutomata } from './GamePhaseAutomata_generated.js';
import { connectReduxAutomata, useReduxAutomata } from '../src/index.js';
import { describe, expect, test, beforeEach } from 'vitest';
import automata from '@yantrix/automata/dist/Automata.js';

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
				state.score = action.payload.score;
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

	let gamePhaseAutomataReduxId: string = '';

	beforeEach(() => {
		store.dispatch(testReducer.actions.resetState());
		gamePhaseAutomataReduxId = connectReduxAutomata({
			reduxDispatch: store.dispatch,
			automata: new GamePhaseAutomata(),
			reduxActionGenerator: (automataStateContext) => {
				return {
					type: 'testReducer/dispatchFromFSM',
					payload: automataStateContext.context,
				};
			},
		});
	});

	test('should save state in redux', () => {
		const [automata, dispatch] = useReduxAutomata(gamePhaseAutomataReduxId);
		dispatch({
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
		const [automata, dispatch] = useReduxAutomata(gamePhaseAutomataReduxId);
		try {
			dispatch({
				action: -111,
				payload: {
					players: 3,
					score: 0,
				},
			});
		} catch (e) {}
		expect(automata.context).deep.equal({
			index: -1,
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
		const [automata, dispatch] = useReduxAutomata(gamePhaseAutomataReduxId);
		dispatch({
			action: actionsDictionary['/RESET'],
			payload: {
				players: 6,
				score: 8,
			},
		});
		dispatch({
			action: actionsDictionary['/MENU_HOVER'],
			payload: {
				players: 3,
				score: 0,
			},
		});

		expect(automata.context).deep.equal({
			players: 6,
			score: 8,
		});
		expect(store.getState()).deep.equal({
			testReducer: {
				players: 6,
				score: 8,
				callCount: 2,
			},
		});
	});

	test('should raise error unknown automata', () => {
		expect(() => {
			useReduxAutomata('-1');
		}).toThrowError();
	});
});
