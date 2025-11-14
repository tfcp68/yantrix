import {
	TAutomataActionPayload,
	TAutomataBaseActionType,
	TStaticMethods,
} from '@yantrix/core';
import { useRef, useSyncExternalStore } from 'react';
import { trace } from '../debug';
import { setInitialStaticMethods } from '../helpers';
import { automatasList, fsm_context, getSnapshotWithSelector } from '../store/store';
import {
	TAutomata,
	TAutomataConstructorWithStatic,
	TPreviousContext,
	TUseFSMOptions,
	TUseFSMProps,
	TUseFsmReturnWithSelection,
} from '../types';
import { dispatchWrapper } from '../utils/dispatchWrapper';

type TGenericAction = TAutomataActionPayload<
	TAutomataBaseActionType,
	Record<TAutomataBaseActionType, unknown>
>;

export function useFSMWithSelector<Selection>(
	Automata: TUseFSMProps | TAutomataConstructorWithStatic,
	options: TUseFSMOptions<TAutomata, Selection>,
): TUseFsmReturnWithSelection<Selection> {
	const selectorFn = options.selector;
	const isEqualFn = options.isEqual;

	const idRef = useRef<string>('');
	if (!idRef.current) {
		idRef.current = fsm_context.initializeFSM(Automata);
	}
	const id = idRef.current;
	const store = fsm_context.getStore(id);
	const instance = store.getSnapshot();

	const staticsRef = useRef<TStaticMethods>(setInitialStaticMethods(Automata));

	const previousContextRef = useRef<TPreviousContext>({ state: null, context: {} });

	const lastActionRef = useRef<TGenericAction>({ action: null, payload: {} });

	const dispatch = <
		ActionType extends number,
		PayloadType extends { [K in ActionType]: TAutomataActionPayload<ActionType, PayloadType>['payload'] },
	>(action: TAutomataActionPayload<ActionType, PayloadType>) => {
		lastActionRef.current = action;
		previousContextRef.current = instance.getContext();
		dispatchWrapper({
			store,
			action,
		});
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

	const selection = useSyncExternalStore(
		store.subscribe,
		getSnapshot,
		getSnapshot,
	);

	const getAutomatasList = () => automatasList;

	return {
		state: instance.state,
		getContext: instance.getContext.bind(instance),
		dispatch,
		trace: () => trace(lastActionRef.current, previousContextRef.current),
		getInstanceAutomata: store.getSnapshot,
		getAutomatasList,
		...staticsRef.current,
		selection,
	};
}
