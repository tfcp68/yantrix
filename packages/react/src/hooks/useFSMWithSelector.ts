import {
	TAutomataActionPayload,
	TAutomataBaseActionType,
	TStaticMethods,
} from '@yantrix/core';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { trace } from '../debug';
import { setInitialStaticMethods } from '../helpers';
import { automatasList, fsm_context, getSnapshotWithSelector } from '../store/store';
import {
	TAutomata,
	TExtractAutomataContext,
	TPreviousContext,
	TUseFSMInput,
	TUseFSMOptions,
	TUseFsmReturnWithSelection,
} from '../types';

type TGenericAction = TAutomataActionPayload<
	TAutomataBaseActionType,
	Record<TAutomataBaseActionType, unknown>
>;

/**
 * Like {@link useFSM} but derives a `selection` via a selector function.
 * Re-renders only when the selection changes (shallow or custom equality).
 */
export function useFSMWithSelector<Selection, TContext = TExtractAutomataContext<TAutomata>>(
	inst: TUseFSMInput,
	options: TUseFSMOptions<TAutomata, Selection>,
): TUseFsmReturnWithSelection<Selection, TContext> {
	const selectorFn = options.selector;
	const isEqualFn = options.isEqual;

	const idRef = useRef<string>('');
	if (!idRef.current || !automatasList[idRef.current]) {
		idRef.current = fsm_context.initializeFSM(inst);
	}
	const id = idRef.current;
	const store = fsm_context.getStore(id);
	const instance = store.getSnapshot();

	const staticsRef = useRef<TStaticMethods>(setInitialStaticMethods(inst));

	const previousContextRef = useRef<TPreviousContext>({ state: null, context: {} });
	const lastActionRef = useRef<TGenericAction>({ action: null, payload: {} });

	const dispatch = <
		ActionType extends number,
		PayloadType extends { [K in ActionType]: TAutomataActionPayload<ActionType, PayloadType>['payload'] },
	>(action: TAutomataActionPayload<ActionType, PayloadType>) => {
		lastActionRef.current = action;
		previousContextRef.current = instance.getContext();
		instance.dispatch(action);
	};

	const lastVersionRef = useRef<number>(-1);
	const lastSelectionRef = useRef<Selection | null>(null);

	const getSnapshot = (): Selection =>
		getSnapshotWithSelector<Selection, TStaticMethods>(
			store,
			staticsRef,
			selectorFn,
			lastVersionRef,
			lastSelectionRef,
			isEqualFn,
		);

	const selection = useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);

	useEffect(() => {
		return () => fsm_context.destroyFSM(idRef.current);
	}, []);

	const getAutomatasList = () => automatasList;

	return {
		state: instance.state,
		getContext: instance.getContext.bind(instance),
		dispatch,
		trace: () => trace(lastActionRef.current, previousContextRef.current),
		getInstanceAutomata: () => ({ id, Automata: store.getSnapshot() }),
		getAutomatasList,
		...staticsRef.current,
		selection,
	};
}
