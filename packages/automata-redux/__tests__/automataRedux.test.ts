import { combineReducers, configureStore, createReducer, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { actionsDictionary, GamePhaseAutomata } from '../src/GamePhaseAutomata_generated.js';
import { getAutomataWithReduxDispatch } from '../src/index.js';

const testReducer = createSlice({
	name: 'testReducer',
	initialState: {
		players: 0,
		score: 0,
		count: 0,
	},
	reducers: {
		dispatchFromFSM(state, action) {
			state.count += 1;
			state.players = action.payload.players;
			state.score += action.payload.score;
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

const Automata = getAutomataWithReduxDispatch({
	Automata: GamePhaseAutomata,
	reduxDispatch: store.dispatch,
	reduxActionGenerator: (action) => ({
		type: 'testReducer/dispatchFromFSM',
		payload: {
			...action.payload,
		},
	}),
});

const automata = new Automata();
automata.dispatch({
	action: actionsDictionary['/RESET'],
	payload: { players: 3, score: 0 },
});

console.log(automata.context);
console.log(store.getState());

automata.dispatch({
	action: actionsDictionary['/RESET'],
	payload: { players: 3, score: 0 },
});

console.log(automata.context);
console.log(store.getState());
