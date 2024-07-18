import { combineReducers, configureStore, createSlice } from '@reduxjs/toolkit';
import { connectReduxAutomata, useReduxAutomata } from '../src/index.js';
import { describe, expect, test, beforeEach } from 'vitest';
import { actionsDictionary, AutomataIncludeNotes } from './fixtures/AutomataIncludeNotes_generated';

describe('dispatchFromFSM', () => {
	const reducerInitialState = {
		callCount: 0,
	};
	const testReducer = createSlice({
		name: 'testReducer',
		initialState: reducerInitialState,
		reducers: {
			dispatchFromFSM(state, action) {
				const callCount = state.callCount;
				state = {
					...action.payload,
					callCount: callCount + 1,
				};
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
			automata: new AutomataIncludeNotes(),
			reduxActionGenerator: (automataStateContext) => {
				return {
					type: 'testReducer/dispatchFromFSM',
					payload: automataStateContext.context,
				};
			},
		});
	});

	test('should save state in redux /toA (a1,a2,a3)', () => {
		const [automata, dispatch] = useReduxAutomata(gamePhaseAutomataReduxId);
		dispatch({
			action: actionsDictionary['/toA (a1,a2,a3)'],
			payload: {
				a1: 1,
				a2: 2,
				a3: 3,
			},
		});
		expect(automata.context).deep.equal({
			a1: 1,
			a2: 2,
			a3: 3,
			string: 'str',
			array: [],
			integer: 3,
		});
		expect(store.getState()).deep.equal({
			testReducer: {
				a1: 1,
				a2: 2,
				a3: 3,
				string: 'str',
				array: [],
				integer: 3,
				callCount: 1,
			},
		});
	});

	test("should't save state in redux via error action", () => {
		const [automata, dispatch] = useReduxAutomata(gamePhaseAutomataReduxId);
		expect(() => {
			dispatch({
				action: -111,
				payload: {},
			});
		}).toThrowError();
		expect(automata.context).deep.equal({
			string: 'str',
			array: [],
			integer: 3,
		});
		expect(store.getState()).deep.equal({
			testReducer: {
				callCount: 1,
			},
		});
	});

	test('should save actual state in redux via early action', () => {
		const [automata, dispatch] = useReduxAutomata(gamePhaseAutomataReduxId);
		dispatch({
			action: actionsDictionary['/toA (a1,a2,a3)'],
			payload: {
				a1: 1,
				a2: 2,
				a3: 3,
			},
		});

		expect(automata.context).deep.equal({
			a1: 1,
			a2: 2,
			a3: 3,
			string: 'str',
			array: [],
			integer: 3,
		});
		dispatch({
			action: actionsDictionary['/toB (a1,a2,a3)'],
			payload: {
				a1: 1,
				a2: 2,
				a3: 3,
			},
		});
		expect(store.getState()).deep.equal({
			testReducer: {
				a1: 1,
				a2: 2,
				a3: 3,
				string: 'str',
				array: [],
				integer: 3,
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
