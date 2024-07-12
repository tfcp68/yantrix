import { GenericAutomata, TAutomataStateContext } from '@yantrix/automata';
import { Dispatch, UnknownAction } from '@reduxjs/toolkit';

export type TActionGenerator = (
	automataStateContext: TAutomataStateContext<number, Record<number, any>>,
) => UnknownAction;

export type TAutomataId = string;

export type TConnectedAutomataOptions = {
	basicAutomata: GenericAutomata;
	reduxDispatch: Dispatch;
	reduxActionGenerator: TActionGenerator;
	dispatch: typeof GenericAutomata.prototype.dispatch;
};

export type TReduxConnectedAutomata = Record<TAutomataId, TConnectedAutomataOptions>;
