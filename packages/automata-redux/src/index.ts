import { Dispatch } from '@reduxjs/toolkit';
import { GenericAutomata, TAutomataActionPayload } from '@yantrix/automata';

type TActionGenerator = (actionFromFSM: TAutomataActionPayload<number, Record<number, any>>) => {
	type: string;
	payload?: any;
};

export const DispatchFromFSMToReduxGenerator = (dispatchToFSMGeneratorProps: {
	reduxDispatch: Dispatch;
	reduxActionGenerator: TActionGenerator;
}) => {
	return (action: TAutomataActionPayload<number, Record<number, any>>) => {
		const reduxAction = dispatchToFSMGeneratorProps.reduxActionGenerator(action);
		return dispatchToFSMGeneratorProps.reduxDispatch(reduxAction);
	};
};

export const getAutomataWithReduxDispatch = (props: {
	Automata: typeof GenericAutomata;
	dispatchFromFSMToRedux: ReturnType<typeof DispatchFromFSMToReduxGenerator>;
}) => {
	class NewAutomata extends props.Automata {
		dispatch: typeof GenericAutomata.prototype.dispatch = (action) => {
			const dispatched = super.dispatch(action);
			props.dispatchFromFSMToRedux(action);
			return dispatched;
		};
	}
	return NewAutomata;
};
