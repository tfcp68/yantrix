import { TAutomataActionPayload, TAutomataBaseActionType } from '@yantrix/core';
import { useRef, useSyncExternalStore } from 'react';
import { trace } from '../debug';
import { readVersion, setInitialStaticMethods } from '../helpers';
import { automatasList } from '../store/store';
import {
	TAutomata,
	TExtractAutomataContext,
	TPreviousContext,
	TUseFSMInput,
	TUseFSMRegistrationOptions,
	TUseFsmReturn,
} from '../types';
import { useFSMRegistration } from './useFSMRegistration';

/**
 * Subscribes a React component to a Yantrix FSM instance.
 * Re-renders when state or context changes. Cleans up on unmount.
 */
export const useFSM = <TContext = TExtractAutomataContext<TAutomata>>(
	instance: TUseFSMInput,
	options: TUseFSMRegistrationOptions = {},
): TUseFsmReturn<TContext> => {
	const store = useFSMRegistration(instance, options.name);
	const staticMethods = setInitialStaticMethods(instance);

	const getVersion = () => readVersion(store.getSnapshot());
	useSyncExternalStore<number>(store.subscribe, getVersion, getVersion);

	const previousContextRef = useRef<TPreviousContext>({ state: null, context: {} });

	type TGenericAction = TAutomataActionPayload<
		TAutomataBaseActionType,
		Record<TAutomataBaseActionType, unknown>
	>;
	const lastActionRef = useRef<TGenericAction>({ action: null, payload: {} });

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
		getInstanceAutomata: () => ({ id: store.route, Automata: instance }),
		getAutomatasList,
		...staticMethods,
	};
};
