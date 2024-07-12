import { Dispatch } from '@reduxjs/toolkit';
import { GenericAutomata, TAutomataStateContext } from '@yantrix/automata';
import { uniqId } from '@yantrix/utils';
import { TActionGenerator, TAutomataId, TReduxConnectedAutomata } from './types.js';

const reduxConnectedAutomata: TReduxConnectedAutomata = {};

export const getReduxConnectedAutomata = (): Readonly<TReduxConnectedAutomata> => {
	return reduxConnectedAutomata;
};

const dispatchToRedux = (props: {
	reduxDispatch: Dispatch;
	reduxActionGenerator: TActionGenerator;
	automataContext: TAutomataStateContext<number, Record<number, any>>;
}) => {
	const reduxAction = props.reduxActionGenerator(props.automataContext);
	return props.reduxDispatch(reduxAction);
};

export const connectReduxAutomata = (props: {
	automata: GenericAutomata;
	reduxDispatch: Dispatch;
	reduxActionGenerator: TActionGenerator;
}) => {
	const dispatch: typeof GenericAutomata.prototype.dispatch = (action) => {
		const newDispatchedContext = props.automata.dispatch(action);
		dispatchToRedux({
			reduxDispatch: props.reduxDispatch,
			reduxActionGenerator: props.reduxActionGenerator,
			automataContext: newDispatchedContext,
		});
		return newDispatchedContext;
	};
	const automataId = uniqId(10);
	reduxConnectedAutomata[automataId] = {
		basicAutomata: props.automata,
		reduxDispatch: props.reduxDispatch,
		reduxActionGenerator: props.reduxActionGenerator,
		dispatch,
	};
	return automataId;
};

export const useReduxAutomata = (automataId: TAutomataId) => {
	const automata = reduxConnectedAutomata[automataId];
	if (!automata) {
		throw new Error(`Automata ${automataId} not found`);
	}
	return [automata.basicAutomata, automata.dispatch] as const;
};
