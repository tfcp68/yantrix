import { GenericAutomata, TAutomataActionPayload } from '@yantrix/automata';
import { isStaticMethodsAutomata, TClassConstructor, TStaticMethods } from '@yantrix/utils';
import { createContext, useContext, useRef, useState } from 'react';
import useSyncExternalStoreExports from 'use-sync-external-store/shim';
import { trace } from '../debug';
import { fsm_context } from '../store/store';
import { isAutomata, isPropsUseFSM } from '../typeGuards';
import { IContextFSM, TAutomata, TPreviousContext, TUseFSMProps, TUseFsmReturn } from '../types';

const { useSyncExternalStore } = useSyncExternalStoreExports;

const storeFsm = createContext<IContextFSM>(fsm_context);

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
export const useFSM = (Automata: TUseFSMProps<TAutomata> | TClassConstructor<TAutomata>): TUseFsmReturn => {
	const automataStore = useContext<IContextFSM>(storeFsm);
	const idFSM = useRef('');

	if (!idFSM.current) {
		// Инициализируем автомат в store'е
		idFSM.current = automataStore.initializeFSM(Automata);
	}
	const externalStore = useSyncExternalStore(automataStore.subscribe, automataStore.getSnapshot);

	const fsmStore = externalStore.automatas[idFSM.current] as TAutomata;

	if (!fsmStore || !fsmStore.state) {
		throw new Error('Automata not found or state is undefined');
	}
	if (!fsmStore) {
		throw new Error('Automata not found');
	}

	const [previousContext, setPreviousContext] = useState<TPreviousContext>({
		state: null,
		context: {},
	});
	const [staticMethods] = useState<TStaticMethods>(() => setInitialStaticMethods(Automata) as TStaticMethods);
	const [lastPayload, setLastPayload] = useState<any>();

	const getInstanceAutomata = () => automataStore.state.automatas[idFSM.current];
	const getAutomatasList = () => automataStore.state.automatas;

	const payloadFromDispatch = <ActionType extends number, PayloadType extends { [K in ActionType]: any } >
	(action: TAutomataActionPayload<ActionType, PayloadType>) => {
		setLastPayload(action.payload);
		setPreviousContext(fsmStore.getContext());

		return fsmStore.dispatch(action);
	};

	return {
		state: fsmStore.state,
		getContext: fsmStore.getContext.bind(fsmStore),
		dispatch: payloadFromDispatch,
		trace: () => trace(lastPayload, previousContext),
		getInstanceAutomata,
		getAutomatasList,
		...staticMethods,
	};
};
