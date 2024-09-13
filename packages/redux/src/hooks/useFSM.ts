import { TAutomataWithStaticMethods, TUseFSMProps } from '../types';

const automatas: Record<string, TAutomataWithStaticMethods> = {};

export const useFSM = ({
	Automata,
	id,
}: TUseFSMProps) => {
	let _fsm = Automata;

	if (id) {
		if (!automatas[id]) {
			automatas[id] = Automata;
			_fsm = automatas[id];
		} else {
			_fsm = automatas[id];
		}
	}

	const getInstanceAutomata = () => new _fsm();

	const { state, getContext, dispatch } = new _fsm();

	const { actions, states, getAction, getState } = _fsm;

	return {
		state,
		getContext,
		dispatch,
		actions,
		states,
		getAction,
		getState,
		getInstanceAutomata,
	};
};
