import {
	TAutomataActionPayload,
	TAutomataBaseActionType,
	TStaticMethods,
} from '@yantrix/core';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { trace } from '../debug';
import { readVersion, setInitialStaticMethods } from '../helpers';
import { automatasList, destroyFSM, fsm_context } from '../store/store';
import { TAutomata, TExtractAutomataContext, TPreviousContext, TUseFSMInput, TUseFsmReturn } from '../types';

export const useFSM = <TContext = TExtractAutomataContext<TAutomata>>(
	inst: TUseFSMInput,
): TUseFsmReturn<TContext> => {
	const idRef = useRef<string>('');
	if (!idRef.current || !automatasList[idRef.current]) {
		idRef.current = fsm_context.initializeFSM(inst);
	}

	const store = fsm_context.getStore(idRef.current);
	const instance = store.getSnapshot();

	const staticMethods = useRef<TStaticMethods>(setInitialStaticMethods(inst));

	const getVersion = () => readVersion(store.getSnapshot());
	useSyncExternalStore<number>(store.subscribe, getVersion, getVersion);

	const previousContextRef = useRef<TPreviousContext>({ state: null, context: {} });

	type TGenericAction = TAutomataActionPayload<
		TAutomataBaseActionType,
		Record<TAutomataBaseActionType, unknown>
	>;
	const lastActionRef = useRef<TGenericAction>({ action: null, payload: {} });

	useEffect(() => {
		return () => destroyFSM(idRef.current);
	}, []);

	const getAutomatasList = () => automatasList;

	const dispatch = <
		ActionType extends number,
		PayloadType extends { [K in ActionType]: TAutomataActionPayload<ActionType, PayloadType>['payload'] },
	>(action: TAutomataActionPayload<ActionType, PayloadType>) => {
		previousContextRef.current = instance.getContext();
		lastActionRef.current = action;
		instance.dispatch(action);
	};

	return {
		state: instance.state,
		getContext: instance.getContext.bind(instance),
		dispatch,
		trace: () => trace(lastActionRef.current, previousContextRef.current),
		getInstanceAutomata: () => ({ id: idRef.current, Automata: store.getSnapshot() }),
		getAutomatasList,
		...staticMethods.current,
	};
};
