import { Middleware, PayloadAction } from '@reduxjs/toolkit';
import { TClassConstructor } from '@yantrix/utils';
import { TAutomata } from '../types';

export type TCreateMiddleware = <
	ActionType extends PayloadAction<any>,
	AutomataType extends TClassConstructor<TAutomata>,
	StoreType = any,
>(
	FSM: AutomataType,
	mapActionToFSMPayload: (action: ActionType) => TInferAutomataPayload<AutomataType>,
	mapContextToAction: (context: TInferAutomataContext<TAutomata>) => ActionType | null,
) => Middleware<ActionType, StoreType>;

export type TInferAutomataPayload<AutomataType> = AutomataType extends
{
	createAction: (action: infer A, payload: infer P) => any;
}
	? (A extends string ? { action: number; payload: P } : never) | null
	: never;

export type TInferAutomataContext<AutomataType> = AutomataType extends {
	getContext: () => infer ContextType;
}
	? ContextType
	: never;
