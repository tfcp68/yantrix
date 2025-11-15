import { TAutomata, TAutomataConstructorWithStatic, TUseFSMProps } from './types';

export const isPropsUseFSM = (props: TUseFSMProps | TAutomataConstructorWithStatic): props is TUseFSMProps => Object.prototype.hasOwnProperty.call(props, 'Automata');

export const isAutomata = (automata: TUseFSMProps | TAutomataConstructorWithStatic): automata is TAutomataConstructorWithStatic => !Object.prototype.hasOwnProperty.call(automata, 'Automata');

export function isFSM<Selection>(fsmStore: TAutomata | Selection): fsmStore is TAutomata {
	const obj = fsmStore;
	return obj != null && typeof obj === 'object' && 'state' in obj;
}

type THasCycle = { currentCycle: number };

export function hasCycle(x: unknown): x is THasCycle {
	return !!x && typeof (x as any).currentCycle === 'number';
}
