import { Dispatch } from '@reduxjs/toolkit';
import { GenericAutomata, TAutomataActionPayload } from '@yantrix/automata';

type TActionGenerator = (actionFromFSM: TAutomataActionPayload<number, Record<number, any>>) => {
	type: string;
	payload?: any;
};

export const getAutomataWithReduxDispatch = (props: {
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
