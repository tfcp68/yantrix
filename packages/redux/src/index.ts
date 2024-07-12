import { Action, Dispatch, UnknownAction } from '@reduxjs/toolkit';
import { GenericAutomata, TAutomataActionPayload, TAutomataStateContext } from '@yantrix/automata';
import { uniqId } from '@yantrix/utils';

type TActionGenerator = (automataStateContext: TAutomataStateContext<number, Record<number, any>>) => UnknownAction;

export const DispatchFromFSMToReduxGenerator = (dispatchToFSMGeneratorProps: {
	reduxDispatch: Dispatch;
	reduxActionGenerator: TActionGenerator;
}) => {
	return (action: TAutomataActionPayload<number, Record<number, any>>) => {
		// const reduxAction = dispatchToFSMGeneratorProps.reduxActionGenerator(action);
		// return dispatchToFSMGeneratorProps.reduxDispatch(reduxAction);
	};
};

export const getAutomataWithReduxDispatch = (props: {
	Automata: typeof GenericAutomata;
	dispatchFromFSMToRedux: ReturnType<typeof DispatchFromFSMToReduxGenerator>;
}) => {
	class NewAutomata extends props.Automata {
		// dispatch: typeof GenericAutomata.prototype.dispatch = (action) => {
		// 	const newDispatchedContext = super.dispatch(action);
		// 	props.dispatchFromFSMToRedux(newDispatchedContext);
		// };
	}

	return NewAutomata;
};

type TAutomataId = string;

type TConnectedAutomataOptions = {
	basicAutomata: GenericAutomata;
	reduxDispatch: Dispatch;
	reduxActionGenerator: TActionGenerator;
	dispatch: typeof GenericAutomata.prototype.dispatch;
};

type TReduxConnectedAutomata = Record<TAutomataId, TConnectedAutomataOptions>;

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
