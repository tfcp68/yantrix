import { GenericAutomata, TAutomataStateContext } from '@yantrix/automata';
import {
	CaseReducer,
	createSlice,
	Dispatch,
	PayloadAction,
	SliceSelectors,
	UnknownAction,
	ValidateSliceCaseReducers,
} from '@reduxjs/toolkit';

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

export type TCreateFSMSliceOptions<Actions extends string> = {
	name: string;
	fsm: typeof GenericAutomata;
	contextToRedux?: (context?: TStateFSMSlice) => any;
	actionsFSM: Record<Actions, number>;
	reducerPath?: string;
	selectors?: SliceSelectors<TStateFSMSlice>;
};

export type TCreateFSMSlicerReturned<
	Actions extends string,
	State extends TStateFSMSlice = TStateFSMSlice,
	Name extends string = string,
	ReducerPath extends string = Name,
	Selectors extends SliceSelectors<TStateFSMSlice> = SliceSelectors<TStateFSMSlice>,
> = ReturnType<typeof createSlice<State, TReducersFSMSlice<Actions>, Name, Selectors, ReducerPath>>;

export type TReducersFSMSlice<
	Actions extends string,
	State extends TStateFSMSlice = TStateFSMSlice,
> = ValidateSliceCaseReducers<State, Record<Actions, CaseReducer<State, PayloadAction<Partial<State>>>>>;

export type TStateFSMSlice = {
	state: number | null;
	context: any;
};
