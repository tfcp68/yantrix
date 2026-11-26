import {
	TAutomataActionPayload,
	TAutomataBaseActionType,
	TStaticMethods,
} from '@yantrix/core';
import { useMemo, useRef, useSyncExternalStore } from 'react';
import { trace } from '../debug';
import { setInitialStaticMethods } from '../helpers';
import { automatasList, getSnapshotWithSelector } from '../store/store';
import {
	TAutomata,
	TExtractAutomataContext,
	TPreviousContext,
	TUseFSMInput,
	TUseFSMOptions,
	TUseFsmReturnWithSelection,
} from '../types';
import { useFSMRegistration } from './useFSMRegistration';

type TGenericAction = TAutomataActionPayload<
	TAutomataBaseActionType,
	Record<TAutomataBaseActionType, unknown>
>;

/**
 * Like {@link useFSM} but derives a `selection` via a selector function.
 * Re-renders only when the selection changes (shallow or custom equality).
 */
export function useFSMWithSelector<Selection, TContext = TExtractAutomataContext<TAutomata>>(
	instance: TUseFSMInput,
	options: TUseFSMOptions<TAutomata, Selection>,
): TUseFsmReturnWithSelection<Selection, TContext> {
	const selectorFn = options.selector;
	const isEqualFn = options.isEqual;

	const store = useFSMRegistration(instance, options.name);
	const staticsRef = useMemo(() => ({ current: setInitialStaticMethods(instance) }), [instance]);

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

	const lastVersionRef = useMemo(() => ({ current: -1 }), [instance]);
	const lastSelectionRef = useMemo(() => ({ current: null as Selection | null }), [instance]);

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

	const getAutomatasList = () => automatasList;

	return {
		state: instance.state,
		getContext: instance.getContext.bind(instance),
		dispatch,
		trace: () => trace(lastActionRef.current, previousContextRef.current),
		getInstanceAutomata: () => ({ id: store.route, Automata: instance }),
		getAutomatasList,
		...staticsRef.current,
		selection,
	};
}
