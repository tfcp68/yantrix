import { Middleware, PayloadAction } from '@reduxjs/toolkit';
import { TAutomata } from '../types';

export type TCreateMiddleware = <ActionType extends PayloadAction, AutomataType extends TAutomata, StoreType = any>(
	FSM: AutomataType,
	// if the following mapper returns null, the Payload is not dispatched to FSM
	// mapActionToFSMPayload: (action: ActionType) => TInferAutomataPayload<AutomataType>,
	// // if the following mapper returns null, the Action is not dispatched to Redux
	// mapContextToAction: (context: TInferAutomataContext<ActionType>) => ActionType,
) => Middleware<ActionType, StoreType>;
