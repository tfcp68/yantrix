import { IAutomata, TAutomataBaseActionType, TAutomataBaseEventType, TAutomataBaseStateType } from '@yantrix/automata';
import { TClassConstructor } from '@yantrix/utils';

export type TUseFSMProps<Automata extends TAutomata> = {
	Automata: TClassConstructor<Automata>;
	id?: string;
};

export type TAutomata = IAutomata<
	TAutomataBaseStateType,
	TAutomataBaseActionType,
	TAutomataBaseEventType,
	Record<TAutomataBaseStateType, any>,
	Record<TAutomataBaseActionType, any>,
	Record<TAutomataBaseEventType, any>
>;
