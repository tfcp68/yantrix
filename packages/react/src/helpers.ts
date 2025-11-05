import { GenericAutomata, isStaticMethodsAutomata, TClassConstructor } from '@yantrix/core';
import { hasCycle, isAutomata, isPropsUseFSM } from './typeGuards';
import { TAutomata, TUseFSMProps } from './types';

export const isNullish = (v: unknown): v is null | undefined => v === null || v === undefined;

/**
 * Return a shallow, value-object copy of the Automata class "static side".
 * It includes codegen helpers (e.g., getState/getAction) when passed either:
 * - a class constructor with statics or
 * - a props object { Automata, id } from codegen.
 */
export const setInitialStaticMethods = (Automata: TUseFSMProps<TAutomata> | TClassConstructor<TAutomata>) => {
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
export const readVersion = (fsm: TAutomata): number => (hasCycle(fsm) ? fsm.currentCycle : 0);
