import { TAutomataActionPayload, TAutomataBaseActionType, TAutomataBaseStateType } from '@yantrix/automata';
import { isStaticMethodsAutomata, TClassConstructor, TStaticMethods, uniqId } from '@yantrix/utils';
import { useState } from 'react';
import { isAutomata, isPropsUseFSM } from '../typeGuards';
import { TAutomata, TTraceTransaction, TUseFSMProps } from '../types';

const automatas: Record<string, TAutomata> = {};

const setInstance = (id: string, Automata: TClassConstructor<TAutomata>) => {
	if (!automatas[id]) {
		automatas[id] = new Automata();
		return automatas[id];
	} else {
		return automatas[id];
	}
};

export const useFSM = (Automata: TUseFSMProps<TAutomata> | TClassConstructor<TAutomata>) => {
	const setInitialAutomata = () => {
		if (isAutomata(Automata) && isStaticMethodsAutomata(Automata)) {
			const id = Automata.id as string;

			return setInstance(id, Automata);
		} else if (isPropsUseFSM(Automata)) {
			const id = Automata.id;

			return setInstance(id, Automata.Automata);
		} else {
			return undefined;
		}
	};

	const setInitialStaticMethods = () => {
		if (isAutomata(Automata) && isStaticMethodsAutomata(Automata)) {
			return {
				...Automata,
			};
		} else if (isPropsUseFSM(Automata)) {
			return {
				...Automata.Automata,
			};
		} else {
			return undefined;
		}
	};

	const [automata] = useState<TAutomata>(() => setInitialAutomata() as TAutomata);
	const [previousContext, setPreviousContext] = useState<any>();
	const [staticMethods] = useState<TStaticMethods>(() => setInitialStaticMethods() as TStaticMethods);
	const [lastPayload, setLastPayload] = useState<any>();

	const getInstanceAutomata = () => automata;
	const getAutomatasList = () => automatas;

	const payloadFromDispatch = <ActionType extends number, PayloadType extends { [K in ActionType]: any } >
	(action: TAutomataActionPayload<ActionType, PayloadType>) => {
		setLastPayload(action.payload);
		setPreviousContext(automata.getContext());

		return automata.dispatch(action);
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
		state: automata.state,
		getContext: automata.getContext.bind(automata),
		dispatch: payloadFromDispatch,
		trace,
		getInstanceAutomata,
		getAutomatasList,
		...staticMethods,
	};
};
