import { GenericAutomata, TAutomataStateContext } from '@yantrix/automata';
import { CaseReducer, Dispatch, PayloadAction, UnknownAction, ValidateSliceCaseReducers } from '@reduxjs/toolkit';
import { actionsDictionary } from '../__tests__/fixtures/AutomataIncludeNotes_generated';

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

export type TCreateFSMSlice = {
	name: string;
	fsm: typeof GenericAutomata;
};

export type TReducersFSMSlice = ValidateSliceCaseReducers<
	any,
	Record<keyof typeof actionsDictionary, CaseReducer<any, PayloadAction<any>>>
>;

export type TStateFSMSlice = {
	state: number | null;
	context: any;
};
