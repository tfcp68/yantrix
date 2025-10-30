import {
	GenericAutomata,
	isStaticMethodsAutomata,
	TAutomataActionPayload,
	TAutomataBaseActionType,
	TClassConstructor,
	TStaticMethods,
} from '@yantrix/core';
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { trace } from '../debug';
import { isNullish } from '../helpers';
import { automatasList, fsm_context } from '../store/store';
import { hasCycle, isAutomata, isPropsUseFSM } from '../typeGuards';
import { TAutomata, TPreviousContext, TUseFSMOptions, TUseFSMProps, TUseFsmReturn } from '../types';

/**
 * Return a shallow, value-object copy of the Automata class "static side".
 * It includes codegen helpers (e.g., getState/getAction) when passed either:
 * - a class constructor with statics, or
 * - a props object { Automata, id } from codegen.
 */
const setInitialStaticMethods = (Automata: TUseFSMProps<TAutomata> | TClassConstructor<TAutomata>) => {
	if (isAutomata(Automata) && isStaticMethodsAutomata(Automata)) {
		return { ...Automata };
	} else if (isPropsUseFSM(Automata)) {
		return { ...Automata.Automata };
	} else {
		return { ...GenericAutomata };
	}
};

/**
 * Read the "version" of the FSM. Version increments with each transition.
 */
const readVersion = (fsm: TAutomata): number => {
	return hasCycle(fsm) ? fsm.currentCycle : 0;
};

/**
 * useFSM
 *
 * A React hook that:
 * - Initializes/returns a singleton FSM instance by id (codegen id by default)
 * - Subscribes React to FSM changes using useSyncExternalStore
 * - Optionally narrows the subscription through a selector(snapshot, statics) -> selection with isEqual for memo stability
 * - Exposes imperative helpers: dispatch, getContext, trace, and class statics
 *
 * Generics:
 * - Selection: the value returned by the selector (if provided)
 * - Statics: type of the class static helpers exposed in selector (extends TStaticMethods)
 *
 * Parameters:
 * - Automata: either a codegen class constructor or a props object { Automata, id }
 * - options?: {
 *     selector: (snapshot: TAutomata, statics: Statics) => Selection;
 *     isEqual?: (a: Selection, b: Selection) => boolean;
 *   }
 *
 * Returns:
 * - TUseFsmReturn mixed with class static helpers (getState/getAction/etc.)
 *
 * Notes:
 * - Without a selector: hook subscribes to FSM "version" (currentCycle) and rerenders on each transition
 * - With selector: hook recomputes selection only when a version changes; isEqual can preserve reference to avoid rerenders
 * - trace() uses refs internally (not state) to avoid incidental rerenders on dispatch
 */
export const useFSM = <Selection, Statics extends TStaticMethods = TStaticMethods>(
	Automata: TUseFSMProps<TAutomata> | TClassConstructor<TAutomata>,
	options?: TUseFSMOptions<TAutomata, Selection, Statics>,
): TUseFsmReturn => {
	const idFSM = useRef<string>('');
	if (!idFSM.current) {
		idFSM.current = fsm_context.initializeFSM(Automata);
	}

	// Per-FSM store providing subscribe/getSnapshot/changeState
	const store = fsm_context.getStore(idFSM.current);

	const staticMethods = useRef<Statics>(setInitialStaticMethods(Automata) as Statics);

	const selectorFn = options?.selector ?? undefined;
	const isEqualFn = options?.isEqual ?? undefined;

	let fsmStore: any;

	if (!selectorFn) {
		const getVersion = () => {
			const snap = store.getSnapshot();
			return readVersion(snap);
		};
		fsmStore = useSyncExternalStore<number>(
			store.subscribe,
			getVersion,
			getVersion,
		);
	} else {
		type TInst =
			| { hasValue: true; value: Selection }
			| { hasValue: false; value: null };

		// Keep the last actually rendered selection. This helps maintain reference stability across selector churn.
		const instRef = useRef<TInst | null>(null);
		const inst = (instRef.current ?? (instRef.current = { hasValue: false, value: null }));

		const [getSelection, getServerSelection] = useMemo(() => {
			let hasMemo = false;
			let memoizedSelection: Selection;

			// Tracks the last observed version; recompute only if it changes
			let lastVersion: number = -1;

			const memoizedSelector = (nextSnapshot: TAutomata): Selection => {
				const nextVersion = readVersion(nextSnapshot);

				// First run for this memoized closure
				if (!hasMemo) {
					hasMemo = true;
					lastVersion = nextVersion;

					const nextSel = selectorFn(nextSnapshot, staticMethods.current);
					// Try to reuse previously rendered selection (from inst) if logically equal
					if (isEqualFn && inst.hasValue) {
						const curr = inst.value as Selection;
						if (isEqualFn(curr, nextSel)) {
							memoizedSelection = curr;
							return curr;
						}
					}
					memoizedSelection = nextSel;
					return nextSel;
				}

				// No transition -> return memo to avoid recomputation
				if (nextVersion === lastVersion) {
					return memoizedSelection;
				}

				// Version changed -> recompute selection
				const nextSel = selectorFn(nextSnapshot, staticMethods.current);

				// Preserve reference when logically equal
				if (isEqualFn && isEqualFn(memoizedSelection, nextSel)) {
					lastVersion = nextVersion;
					return memoizedSelection;
				}

				lastVersion = nextVersion;
				memoizedSelection = nextSel;
				return nextSel;
			};

			// Wrap getSnapshot to run through our memoized selector
			const getSnapshotWithSelector = () => memoizedSelector(store.getSnapshot());
			// For SSR this can be the same; we use the same snapshot accessor by default
			const getServerSnapshotWithSelector = () => memoizedSelector(store.getSnapshot());

			return [getSnapshotWithSelector, getServerSnapshotWithSelector];
		}, [store, selectorFn, isEqualFn]);

		// Subscribe to the computed selection
		const value = useSyncExternalStore<Selection>(
			store.subscribe,
			getSelection,
			getServerSelection,
		);

		// Record the last rendered selection value
		useEffect(() => {
			inst.hasValue = true;
			inst.value = value;
		}, [value]);

		fsmStore = value;
	}

	if (selectorFn) {
		if (isNullish(fsmStore)) {
			throw new Error('Undefined or null selection value');
		}
	}

	/**
	 * Get the actual Automata instance by id.
	 * Consumers read from this instance (state/context) in the returned API.
	 */
	const getInstance = (): TAutomata => {
		const inst = automatasList[idFSM.current];
		if (!inst) {
			throw new Error(`FSM '${idFSM.current}' not initialized`);
		}
		return inst;
	};

	/**
	 * Keep trace-related data in refs so that dispatch doesn't cause rerenders.
	 */
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

	/**
	 * dispatch wrapper:
	 * - stores last payload + previous context for trace()
	 * - calls instance.dispatch()
	 * - notifies store subscribers via changeState()
	 */
	const payloadFromDispatch = <
		ActionType extends number,
		PayloadType extends { [K in ActionType]: any },
	>(
		action: TAutomataActionPayload<ActionType, PayloadType>,
	) => {
		const instance = getInstance();
		lastActionRef.current = action;
		previousContextRef.current = instance.getContext();

		// Perform transition
		instance.dispatch(action);

		// Notify subscribers bound via useSyncExternalStore
		fsm_context.getStore(idFSM.current).changeState();
	};

	const instance = getInstance();

	return {
		state: instance.state,
		getContext: instance.getContext.bind(instance),
		dispatch: payloadFromDispatch,
		trace: () => trace(lastActionRef.current, previousContextRef.current),
		getInstanceAutomata: getInstance,
		getAutomatasList,
		...staticMethods.current,
	};
};
