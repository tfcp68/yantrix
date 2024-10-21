import { TStaticMethods } from './types';

export const isNumber = (t: any): t is number => Number.isFinite(t);
export const isPositiveNumber = (t: any): t is number => isNumber(t) && t >= 0;
export const isPositiveInteger = (t: any): t is number => isPositiveNumber(t) && Number.isSafeInteger(t);
export const isInteger = (t: any): t is number => Number.isSafeInteger(t);
export const isStaticMethodsAutomata = (Automata: any): Automata is TStaticMethods => Object.prototype.hasOwnProperty.call(Automata, 'id');
