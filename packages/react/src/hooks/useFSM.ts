import { TAutomataActionPayload } from '@yantrix/automata';
import { isStaticMethodsAutomata, TStaticMethods } from '@yantrix/utils';
import React, { useState } from 'react';
import { TAutomata, TUseFSMProps } from '../types';

const automatas: Record<string, TAutomata> = {};

export const useFSM = ({
	Automata,
	id,
}: TUseFSMProps<TAutomata>) => {
	const [previousContext, setPreviousContext] = useState<any>();
	const [staticMethods, setStaticMethods] = useState<TStaticMethods>();
	const [lastPayload, setLastPayload] = useState<any>();

	let _fsm = new Automata();

	if (id) {
		if (!automatas[id]) {
			automatas[id] = _fsm;
		} else {
			_fsm = automatas[id];
		}
	}

	React.useEffect(() => {
		if (isStaticMethodsAutomata(Automata)) {
			setStaticMethods({
				...Automata,
			});
		}
	}, []);

	const getInstanceAutomata = () => _fsm;

	const payloadFromDispatch = <ActionType extends number, PayloadType extends { [K in ActionType]: any } >
	(action: TAutomataActionPayload<ActionType, PayloadType>) => {
		setLastPayload(action.payload);
		setPreviousContext(_fsm.getContext());

		return _fsm.dispatch(action);
	};

	const trace = React.useCallback(() => {
		return {
			lastPayload,
			previousContext,
		};
	}, [lastPayload, previousContext]);

	return {
		state: _fsm.state,
		getContext: _fsm.getContext.bind(_fsm),
		dispatch: payloadFromDispatch,
		trace,
		getInstanceAutomata,
		...staticMethods,
	};
};
