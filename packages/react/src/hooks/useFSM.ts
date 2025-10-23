import { GenericAutomata, TAutomataActionPayload } from '@yantrix/automata';
import { isStaticMethodsAutomata, TClassConstructor, TStaticMethods } from '@yantrix/utils';
import { useRef, useState, useSyncExternalStore } from 'react';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';
import { trace } from '../debug';
import { automatasList, fsm_context } from '../store/store';
import { isAutomata, isFSM, isPropsUseFSM } from '../typeGuards';
import { TAutomata, TPreviousContext, TUseFSMOptions, TUseFSMProps, TUseFsmReturn } from '../types';

const setInitialStaticMethods = (Automata: TUseFSMProps<TAutomata> | TClassConstructor<TAutomata>) => {
	if (isAutomata(Automata) && isStaticMethodsAutomata(Automata)) {
		return {
			...Automata,
		};
	} else if (isPropsUseFSM(Automata)) {
		return {
			...Automata.Automata,
		};
	} else {
		return {
			...GenericAutomata,
		};
	}
};
/**
 * The `useFSM` hook is used for initializing and managing an FSM (Finite State Machine) in the context of React.
 *
 * @template TAutomata The type of automaton (FSM) to be used.
 *
 * @param {TUseFSMProps<TAutomata> | TClassConstructor<TAutomata>} Automata - The automaton class or its props.
 *
 * @param options
 * @throws {Error} If the automaton is not found or its state is undefined.
 *
 * @description
 * The hook performs the following actions:
 * - Initializes the automaton using the provided class or props with a unique automaton ID.
 * - Provides methods to manage the automaton's state, dispatch actions, and trace its behavior.
 * - Uses `useSyncExternalStore` to synchronize with the automaton state context and subscribe to its changes.
 *
 * @example
 * // Example of using the useFSM hook
 * const { state, dispatch, getContext } = useFSM(MyAutomataClass);
 *
 * console.log(state);  // Current state of the automaton
 * dispatch({ type: MyActionType, payload: {} });  // Dispatch an action
 * const context = getContext();  // Retrieve the current context of the automaton
 */
export const useFSM = <Selection>(
	Automata: TUseFSMProps<TAutomata> | TClassConstructor<TAutomata>,
	options?: TUseFSMOptions<TAutomata, Selection>,
): TUseFsmReturn => {
	const idFSM = useRef('');

	if (!idFSM.current) {
		// Инициализируем автомат в store'е
		idFSM.current = fsm_context.initializeFSM(Automata);
	}
	const fsmStore = (options?.selector)
		? useSyncExternalStoreWithSelector<TAutomata, Selection>(
			fsm_context.subscribe,
			fsm_context.getSnapshot,
			null,
			options?.selector,
			options?.isEqual,
		)
		: useSyncExternalStore<TAutomata>(fsm_context.subscribe, fsm_context.getSnapshot);

	if (!fsmStore) {
		if (isFSM(fsmStore)) {
			throw new Error('Automata not found');
		} else {
			throw new Error('Undefined or null selection value');
		}
	}

	const [previousContext, setPreviousContext] = useState<TPreviousContext>({
		state: null,
		context: {},
	});
	const staticMethods = useRef<TStaticMethods>(setInitialStaticMethods(Automata) as TStaticMethods);
	const [lastPayload, setLastPayload] = useState<any>();

	const getInstanceAutomata = () => automatasList[idFSM.current];
	const getAutomatasList = () => automatasList;

	const payloadFromDispatch = <ActionType extends number, PayloadType extends { [K in ActionType]: any } >
	(action: TAutomataActionPayload<ActionType, PayloadType>) => {
		setLastPayload(action.payload);
		setPreviousContext(automatasList[idFSM.current].getContext());

		return automatasList[idFSM.current].dispatch(action);
	};

	return {
		state: automatasList[idFSM.current].state,
		getContext: automatasList[idFSM.current].getContext.bind(fsmStore),
		dispatch: payloadFromDispatch,
		trace: () => trace(lastPayload, previousContext),
		getInstanceAutomata,
		getAutomatasList,
		...staticMethods.current,
	};
};
