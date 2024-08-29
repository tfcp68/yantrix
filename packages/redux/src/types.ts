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

export type TCreateFSMSliceOptions<Automata> = {
	name: string;
	fsm: Automata;
	contextToRedux?: (context?: TStateFSMSlice) => any;
	reducerPath?: string;
	selectors?: SliceSelectors<TStateFSMSlice>;
};

export type TCreateFSMSlicerReturned<
	Actions extends string | number | symbol,
	State extends TStateFSMSlice = TStateFSMSlice,
	Name extends string = string,
	ReducerPath extends string = Name,
	Selectors extends SliceSelectors<TStateFSMSlice> = SliceSelectors<TStateFSMSlice>,
> = ReturnType<typeof createSlice<State, TReducersFSMSlice<Actions>, Name, Selectors, ReducerPath>>;

export type TReducersFSMSlice<
	Actions extends string | number | symbol,
	State extends TStateFSMSlice = TStateFSMSlice,
> = ValidateSliceCaseReducers<State, Record<Actions, CaseReducer<State, PayloadAction<Partial<State>>>>>;

export type TStateFSMSlice = {
	state: number | null;
	context: any;
};

export type TAutomataTypeStaticMethods = {
	id: string;
	actions: any;
	states: any;
	getState: any;
	hasState: any;
	getAction: any;
	createAction: any;
};
