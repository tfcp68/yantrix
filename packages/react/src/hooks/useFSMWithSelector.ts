import {
	TStaticMethods,
} from '@yantrix/core';
import { useMemo, useRef } from 'react';
import { isNullish, readVersion, setInitialStaticMethods } from '../helpers';
import {
	TAutomata,
	TAutomataConstructorWithStatic,
	TUseFSMOptions,
	TUseFSMProps,
	TUseFsmReturnWithSelection,
} from '../types';
import { useFSM } from './useFSM';

/**
 * A small tagged union to store the last rendered selection value.
 * Helps preserve reference when isEqual reports logical equality.
 */
type TSelectionRef<Selection> =
	| { has: true; val: Selection }
	| { has: false; val: undefined };

/**
 * useFSMWithSelector
 *
 * A React hook that wraps useFSM and derives a memoized "selection" from the FSM instance
 * using a selector(snapshot, statics). The selection is recomputed only when the FSM "version"
 * (currentCycle) changes. If an optional isEqual is provided and reports logical equality,
 * the hook preserves the previous reference to avoid unnecessary re-renders.
 *
 * Contract:
 * - Throws an error if the selector returns null or undefined
 * - The "statics" object (class-level helpers) is stable across renders and passed as the second selector argument.
 * - The underlying FSM singleton lifecycle and subscription are managed by useFSM.
 *
 * @template Selection The derived selection value type returned by the selector.
 * @template Statics The type of automata static helpers exposed to the selector (extends TStaticMethods).
 *
 * @param Automata Either a generated Automata class (constructor with statics), or a props object { Automata, id } for a separate instance.
 * @param options Selector options:
 *  - selector: (snapshot: TAutomata, statics: Statics) => Selection
 *  - isEqual?: (a: Selection, b: Selection) => boolean — when provided and returns true, the previous selection reference is preserved.
 *
 * @returns TUseFsmReturnWithSelection<Selection>
 *  The same API as useFSM plus a stable, memoized "selection" field.
 *
 * @example
 * const { selection, dispatch } = useFSMWithSelector(TrafficLight, {
 *   selector: (inst, statics) => {
 *     const st = inst.getContext().state;
 *     const red = statics.getState?.('Red');
 *     const redYellow = statics.getState?.('RedYellow');
 *     return { isRedish: st === red || st === redYellow };
 *   },
 *   isEqual: (a, b) => a.isRedish === b.isRedish,
 * });
 */
export function useFSMWithSelector<Selection>(
	Automata: TUseFSMProps | TAutomataConstructorWithStatic,
	options: TUseFSMOptions<TAutomata, Selection>,
): TUseFsmReturnWithSelection<Selection> {
	// Base FSM wiring: lifecycle, subscription to currentCycle, dispatch/trace/statics, etc.
	const base = useFSM(Automata);

	const selectorFn = options?.selector;
	const isEqualFn = options?.isEqual;

	// Keep statics stable across renders for selector
	const staticsRef = useRef<TStaticMethods>(setInitialStaticMethods(Automata));
	// Keep the last rendered selection for reference preservation
	const prevSelectionRef = useRef<TSelectionRef<Selection>>({ has: false, val: undefined });

	// Snapshot + version gating: selector recomputes only when currentCycle changes
	const instance = base.getInstanceAutomata();
	const version = readVersion(instance);

	// Recompute selection when a version changes; preserve reference if isEqual says values are equal
	const selection = useMemo<Selection>(() => {
		const nextSel = selectorFn(instance, staticsRef.current);

		const prev = prevSelectionRef.current;
		if (!prev.has) {
			prevSelectionRef.current = { has: true, val: nextSel };
			return nextSel;
		}

		if (isEqualFn && isEqualFn(prev.val, nextSel)) {
			// Preserve previous reference on logical equality
			return prev.val;
		}

		prevSelectionRef.current = { has: true, val: nextSel };
		return nextSel;
	}, [version, selectorFn, isEqualFn]);

	// Enforce non-nullish contract for selection
	if (isNullish(selection)) {
		throw new Error('Undefined or null selection value');
	}

	return {
		...base,
		selection,
	};
}
