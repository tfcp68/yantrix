import { combineReducers, configureStore, Dispatch } from '@reduxjs/toolkit';
import { GenericAutomata, TAutomataStateContext } from '@yantrix/automata';
import { uniqId } from '@yantrix/utils';
import GamePhaseTest from '../__tests__/fixtures/GamePhaseAutomataTest';
import { createFSMSlice } from './slice/slice';
import { TActionGenerator, TAutomataId, TReduxConnectedAutomata, TStateFSMSlice } from './types.js';

export * from './slice/slice.js';
export * from './types.js';

const reduxConnectedAutomata: TReduxConnectedAutomata = {};

export function getReduxConnectedAutomata(): Readonly<TReduxConnectedAutomata> {
	return reduxConnectedAutomata;
}

function dispatchToRedux(props: {
	reduxDispatch: Dispatch;
	reduxActionGenerator: TActionGenerator;
	automataContext: TAutomataStateContext<number, Record<number, any>>;
}) {
	const reduxAction = props.reduxActionGenerator(props.automataContext);
	return props.reduxDispatch(reduxAction);
}

export function connectReduxAutomata(props: {
	automata: GenericAutomata;
	reduxDispatch: Dispatch;
	reduxActionGenerator: TActionGenerator;
}) {
	const dispatch: typeof GenericAutomata.prototype.dispatch = (action) => {
		let newContext = props.automata.context;
		try {
			newContext = props.automata.dispatch(action);
			return newContext;
		} finally {
			dispatchToRedux({
				reduxDispatch: props.reduxDispatch,
				reduxActionGenerator: props.reduxActionGenerator,
				automataContext: newContext,
			});
		}
	};
	const automataId = uniqId(10);
	reduxConnectedAutomata[automataId] = {
		basicAutomata: props.automata,
		reduxDispatch: props.reduxDispatch,
		reduxActionGenerator: props.reduxActionGenerator,
		dispatch,
	};
	return automataId;
}

export function useReduxAutomata(automataId: TAutomataId) {
	const automata = reduxConnectedAutomata[automataId];
	if (!automata) {
		throw new Error(`Automata ${automataId} not found`);
	}
	return [automata.basicAutomata, automata.dispatch] as const;
};

const { actions, name, reducer } = createFSMSlice({
	name: GamePhaseTest.id,
	Fsm: GamePhaseTest,
	selectors: {
		state: (sliceState): TStateFSMSlice['state'] => sliceState.state,
		context: (sliceState): TStateFSMSlice['context'] => sliceState.context,
	},
});

const store = configureStore({
	reducer: combineReducers({
		[name]: reducer,
	}),
});
store.dispatch(actions.RESET({}));
