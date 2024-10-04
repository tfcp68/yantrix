import { Dispatch } from '@reduxjs/toolkit';
import { GenericAutomata, TAutomataStateContext } from '@yantrix/automata';
import { uniqId } from '@yantrix/utils';
import { TActionGenerator, TAutomataId, TReduxConnectedAutomata } from './types.js';

export * from './slice/slice.js';
export * from './types.js';
export * from './utility/typeGuards.js';

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
}

// const contextToReduxParams = {
// 	initialCounter: 0,
// 	counter: 0,
// };
//
// const { actions, reducer } = createFSMSlice<
// 	TActionsTrafficLightAutomata,
// 	typeof contextToReduxParams
// >({
// 	name: TrafficLightAutomata.id,
// 	Fsm: TrafficLightAutomata,
// 	contextToRedux: context => ({
// 		...context,
// 		...contextToReduxParams,
// 	}),
//
// });
//
// const store = configureStore({
// 	reducer: combineReducers({
// 		[TrafficLightAutomata.id]: reducer,
// 	}),
// });
//
// store.dispatch(actions.Switch({}));
//
// store.getState();
