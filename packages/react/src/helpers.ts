import { hasCycle, isAutomata, isPropsUseFSM } from './typeGuards';
import { TAutomata, TAutomataConstructorWithStatic, TUseFSMProps } from './types';

export const isNullish = (v: unknown): v is null | undefined => v === null || v === undefined;

/**
 * Return a shallow, value-object copy of the Automata class "static side".
 * It includes codegen helpers (e.g., getState/getAction) when passed either:
 * - a class constructor with statics or
 * - a props object { Automata, id } from codegen.
 */
export const setInitialStaticMethods = (Automata: TUseFSMProps | TAutomataConstructorWithStatic) => {
	if (isAutomata(Automata)) {
		return Automata;
	}
	if (isPropsUseFSM(Automata)) {
		return Automata.Automata;
	}
	throw new TypeError('Unsupported Automata argument passed to setInitialStaticMethods');
};

/**
 * Read the "version" of the FSM. Version increments with each transition.
 */
export const readVersion = (fsm: TAutomata): number => (hasCycle(fsm) ? fsm.currentCycle : 0);

export function shallowEqual(a: any, b: any): boolean {
	if (a === b) return true;
	if (!a || !b) return false;
	if (typeof a !== 'object' || typeof b !== 'object') return false;

	const ka = Object.keys(a);
	const kb = Object.keys(b);
	if (ka.length !== kb.length) return false;

	for (const k of ka) {
		if (a[k] !== b[k]) return false;
	}
	return true;
}
