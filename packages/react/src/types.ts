import { IAutomata, TAutomataBaseActionType, TAutomataBaseEventType, TAutomataBaseStateType } from '@yantrix/automata';

export type TUseFSMProps<Automata extends TAutomata> = {
	Automata: TClassConstructor<Automata>;
	id?: string;
};

export type TClassConstructor<C extends TAutomata> = {
	id: string;
	actions: Record<string, string>;
	states: Record<string, string>;
	getState: (state: any) => number;
	hasState: (instance: any, state: any) => boolean;
	getAction: (action: any) => number;
	createAction: (action: any, payload: any) => {
		action: number;
		payload: any;
	};
	new (...args: any[]): C;
};

export type TAutomata = IAutomata<
	TAutomataBaseStateType,
	TAutomataBaseActionType,
	TAutomataBaseEventType,
	Record<TAutomataBaseStateType, any>,
	Record<TAutomataBaseActionType, any>,
	Record<TAutomataBaseEventType, any>
>;
