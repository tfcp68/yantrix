import {
	TAutomataActionPayload,
	TAutomataBaseActionType,
	TStaticMethods,
} from '@yantrix/core';
import { useRef, useSyncExternalStore } from 'react';
import { trace } from '../debug';
import { readVersion, setInitialStaticMethods } from '../helpers';
import { automatasList, fsm_context } from '../store/store';
import { TAutomataConstructorWithStatic, TPreviousContext, TUseFSMProps, TUseFsmReturn } from '../types';
import { dispatchWrapper } from '../utils/dispatchWrapper';

/**
 * useFSM
 *
 * React hook that initializes and subscribes to a Yantrix FSM instance.
 *
 * Behavior:
 * - Lazily creates or reuses a singleton FSM instance keyed by its id.
 * - Subscribes the component to FSM updates by tracking the machine "version" (currentCycle)
 *   via useSyncExternalStore, ensuring a re-render on every transition.
 * - Exposes imperative helpers: dispatch, getContext, getInstanceAutomata, trace, and automata statics.
 *
 * Contract:
 * - This base hook does not accept a selector. For derived reads, use useFSMWithSelector(...).
 * - trace() is side-effect free: it stores the last action and previous context in refs to avoid extra renders.
 *
 * @param Automata - Either:
 *   - a generated Automata class (constructor with static helpers) or
 *   - a props object { Automata, id } produced by codegen to create a distinct instance per id.
 *
 * @returns TUseFsmReturn
 *   An object with:
 *   - state: current numeric state
 *   - getContext(): current state+context
 *   - dispatch(action): dispatches an action payload
 *   - trace(): { lastPayload, previousContext, timestamp, id }
 *   - getInstanceAutomata(): underlying IAutomata
 *   - getAutomatasList(): registry map of id -> instance
 *   - automata static helpers spread in (e.g., getState, getAction, statesDictionary, actionsDictionary)
 *
 * @example
 * const { getContext, dispatch, getState } = useFSM(TrafficLight);
 * const onClick = () => dispatch({ action: TrafficLight.getAction('Switch'), payload: {} });
 * const { state, context } = getContext();
 * const isRed = state === getState('Red');
 */
export const useFSM = (
	Automata: TUseFSMProps | TAutomataConstructorWithStatic,
): TUseFsmReturn => {
	// Initialize FSM id once
	const idFSM = useRef<string>('');
	if (!idFSM.current) {
		idFSM.current = fsm_context.initializeFSM(Automata);
	}

	const store = fsm_context.getStore(idFSM.current);

	const instance = store.getSnapshot();

	// Keep statics stable across renders
	const staticMethods = useRef<TStaticMethods>(setInitialStaticMethods(Automata));

	// Subscribe to a version to guarantee rerenders on transitions
	const getVersion = () => {
		const snap = store.getSnapshot();
		return readVersion(snap);
	};
	useSyncExternalStore<number>(store.subscribe, getVersion, getVersion);

	// Trace refs (no rerenders)
	const previousContextRef = useRef<TPreviousContext>({
		state: null,
		context: {},
	});
	type TGenericAction = TAutomataActionPayload<
		TAutomataBaseActionType,
		Record<TAutomataBaseActionType, unknown>
	>;
	const lastActionRef = useRef<TGenericAction>({
		action: null,
		payload: {},
	});

	const getAutomatasList = () => automatasList;

	// dispatch wrapper
	const dispatch = <
		ActionType extends number,
		PayloadType extends { [K in ActionType]: TAutomataActionPayload<ActionType, PayloadType>['payload'] },
	>(action: TAutomataActionPayload<ActionType, PayloadType>) => {
		previousContextRef.current = instance.getContext();
		lastActionRef.current = action;
		dispatchWrapper({
			store,
			action,
		});
	};

	return {
		state: instance.state,
		getContext: instance.getContext.bind(instance),
		dispatch,
		trace: () => trace(lastActionRef.current, previousContextRef.current),
		getInstanceAutomata: store.getSnapshot,
		getAutomatasList,
		...staticMethods.current,
	};
};
