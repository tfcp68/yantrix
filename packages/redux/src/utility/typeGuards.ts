import { TStaticMethods } from '../types';

export const isStaticMethodsAutomata = (Automata: any): Automata is TStaticMethods => Object.prototype.hasOwnProperty.call(Automata, 'id');
