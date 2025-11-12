import {
	TAutomataActionPayload,
	TAutomataBaseActionType,
	TStaticMethods,
} from '@yantrix/core';
import { useRef, useSyncExternalStore } from 'react';
import { trace } from '../debug';
import { isNullish, readVersion, setInitialStaticMethods, shallowEqual } from '../helpers';
import { automatasList, fsm_context } from '../store/store';
import {
	TAutomata,
	TAutomataConstructorWithStatic,
	TPreviousContext,
	TUseFSMOptions,
	TUseFSMProps,
	TUseFsmReturnWithSelection,
} from '../types';

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

	const staticsRef = useRef<TStaticMethods>(setInitialStaticMethods(Automata));

	const getInstance = (): TAutomata => {
		const inst = automatasList[id];
		if (!inst) throw new Error(`FSM '${id}' not initialized`);
		return inst;
	};

	const previousContextRef = useRef<TPreviousContext>({ state: null, context: {} });
	type TGenericAction = TAutomataActionPayload<
		TAutomataBaseActionType,
		Record<TAutomataBaseActionType, unknown>
	>;
	const lastActionRef = useRef<TGenericAction>({ action: null, payload: {} });

	const dispatch = <
		ActionType extends number,
		PayloadType extends { [K in ActionType]: any },
	>(action: TAutomataActionPayload<ActionType, PayloadType>) => {
		const instance = getInstance();

		const prevCtx = instance.getContext();
		const prevState = prevCtx.state;
		const prevContextObj = prevCtx.context ?? {};

		lastActionRef.current = action;
		previousContextRef.current = prevCtx;

		const reduced = instance.dispatch(action as any);

		const nextState = reduced.state;
		const nextContextObj = reduced.context ?? {};

		const stateChanged = nextState !== prevState;
		const contextChanged = !shallowEqual(prevContextObj, nextContextObj);

		if (stateChanged || contextChanged) {
			fsm_context.getStore(id).changeState();
		}
	};

	const lastVersionRef = useRef<number>(-1);
	const lastSelectionRef = useRef<Selection | null>(null);

	const getSnapshot = (): Selection => {
		const inst = store.getSnapshot();
		const version = readVersion(inst);

		if (version === lastVersionRef.current && lastSelectionRef.current !== null) {
			return lastSelectionRef.current;
		}

		const nextSel = selectorFn(inst, staticsRef.current);
		if (isNullish(nextSel)) {
			throw new Error('Undefined or null selection value');
		}

		if (lastSelectionRef.current !== null && version !== lastVersionRef.current) {
			if (typeof isEqualFn === 'function') {
				if (isEqualFn(lastSelectionRef.current, nextSel)) {
					lastVersionRef.current = version;
					return lastSelectionRef.current;
				}
				lastSelectionRef.current = nextSel;
				lastVersionRef.current = version;
				return nextSel;
			} else {
				lastSelectionRef.current = nextSel;
				lastVersionRef.current = version;
				return nextSel;
			}
		}

		lastSelectionRef.current = nextSel;
		lastVersionRef.current = version;
		return nextSel;
	};

	const selection = useSyncExternalStore(
		store.subscribe,
		getSnapshot,
		getSnapshot,
	);

	const instance = getInstance();
	const getAutomatasList = () => automatasList;

	return {
		state: instance.state,
		getContext: instance.getContext.bind(instance),
		dispatch,
		trace: () => trace(lastActionRef.current, previousContextRef.current),
		getInstanceAutomata: getInstance,
		getAutomatasList,
		...staticsRef.current,
		selection,
	};
}
