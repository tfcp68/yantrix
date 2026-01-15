import { TStaticMethods } from '@yantrix/core';
import { TAutomata, TAutomataConstructorWithStatic, TUseFSMInput, TUseFSMProps } from './types';

export const isPropsUseFSM = (props: TUseFSMInput): props is TUseFSMProps =>
	Object.prototype.hasOwnProperty.call(props, 'Automata') && typeof props !== 'function';

export const isAutomata = (automata: TUseFSMInput): automata is TAutomataConstructorWithStatic =>
	typeof automata === 'function';
// New type guard: checks that value looks like an automata instance
export function isAutomataInstance(x: unknown): x is TAutomata & TStaticMethods {
	return (
		x != null
		&& typeof x === 'object'
		&& 'state' in x
		&& typeof (x as any).getContext === 'function'
		&& typeof (x as any).dispatch === 'function'
	);
}

type THasCycle = { currentCycle: number };

export function hasCycle(x: unknown): x is THasCycle {
	return !!x && typeof (x as any).currentCycle === 'number';
}
