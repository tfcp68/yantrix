import { TClassConstructor } from '@yantrix/utils';
import { TAutomata, TUseFSMProps } from './types';

export const isPropsUseFSM = (props: any): props is TUseFSMProps<TAutomata> => Object.prototype.hasOwnProperty.call(props, 'Automata');

export const isAutomata = (automata: TUseFSMProps<TAutomata> | TClassConstructor<TAutomata>): automata is TClassConstructor<TAutomata> => !Object.prototype.hasOwnProperty.call(automata, 'Automata');
