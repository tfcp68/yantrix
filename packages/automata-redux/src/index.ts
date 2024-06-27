import { combineReducers, configureStore, Dispatch } from '@reduxjs/toolkit';
import { GenericAutomata, TAutomataActionPayload } from '@yantrix/automata';
import { GamePhaseAutomata } from './GamePhaseAutomata_generated.js';

type TActionGenerator = (actionFromFSM: TAutomataActionPayload<number, Record<number, any>>) => {
	type: string;
	payload?: any;
};

const getAutomataWithReduxDispatch = (props: {
	Automata: typeof GenericAutomata;
	reduxDispatch: Dispatch;
	reduxActionGenerator: TActionGenerator;
}) => {
	class NewAutomata extends props.Automata {
		dispatch: typeof GenericAutomata.prototype.dispatch = (action) => {
			const dispatched = super.dispatch(action);
			props.reduxDispatch(props.reduxActionGenerator(action));
			return dispatched;
		};
	}
	return NewAutomata;
};

// client code
const rootReducer = combineReducers({});

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
		type: 'dispatchFromFSM',
		payload: {
			...action.payload,
		},
	}),
});

const automata = new Automata();
automata.dispatch({ action: 1, payload: {} });
