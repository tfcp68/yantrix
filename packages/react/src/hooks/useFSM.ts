import { TAutomataActionPayload, TAutomataBaseActionType, TAutomataBaseStateType } from '@yantrix/automata';
import { isStaticMethodsAutomata, TStaticMethods, uniqId } from '@yantrix/utils';
import React, { useState } from 'react';
import { TAutomata, TTraceTransaction, TUseFSMProps } from '../types';

const automatas: Record<string, TAutomata> = {};

export const useFSM = ({
	Automata,
	id,
}: TUseFSMProps<TAutomata>) => {
	let _fsm = new Automata();

	if (id) {
		if (!automatas[id]) {
			automatas[id] = _fsm;
		} else {
			_fsm = automatas[id];
		}
	}
	const [previousContext, setPreviousContext] = useState<ReturnType<typeof _fsm.getContext>>(_fsm.getContext());
	const [staticMethods, setStaticMethods] = useState<TStaticMethods>();
	const [lastPayload, setLastPayload] = useState<any>();

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

	const trace = (): TTraceTransaction<TAutomataBaseStateType, TAutomataBaseActionType> => {
		return {
			lastPayload,
			previousContext,
			timestamp: new Date(),
			id: uniqId(10),
		};
	};

	return {
		state: _fsm.state,
		getContext: _fsm.getContext.bind(_fsm),
		dispatch: payloadFromDispatch,
		trace,
		getInstanceAutomata,
		...staticMethods,
	};
};
