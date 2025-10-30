import { TClassConstructor } from '@yantrix/core';
import { TAutomata, TUseFSMProps } from './types';

export const isPropsUseFSM = (props: any): props is TUseFSMProps<TAutomata> => Object.prototype.hasOwnProperty.call(props, 'Automata');

export const isAutomata = (automata: TUseFSMProps<TAutomata> | TClassConstructor<TAutomata>): automata is TClassConstructor<TAutomata> => !Object.prototype.hasOwnProperty.call(automata, 'Automata');

export function isFSM<Selection>(fsmStore: TAutomata | Selection): fsmStore is TAutomata {
	const obj = fsmStore;
	return obj != null && typeof obj === 'object' && 'state' in obj;
}

type THasCycle = { currentCycle: number };

export function hasCycle(x: unknown): x is THasCycle {
	return !!x && typeof (x as any).currentCycle === 'number';
}
