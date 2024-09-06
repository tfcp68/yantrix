import { GenericAutomata, TAutomataStateContext } from '@yantrix/automata';
import {
	CaseReducer,
	Dispatch,
	PayloadAction,
	SliceSelectors,
	UnknownAction,
	ValidateSliceCaseReducers,
	createSlice,
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

export type TReduxConnectedAutomata =
	Record<TAutomataId, TConnectedAutomataOptions>;

export type TCreateFSMSliceOptions<Automata, StateType, ContextType = object>
	= {
		name: string;
		Fsm: Automata;
		contextToRedux?: (context?: ContextType) => any;
		reducerPath?: string;
		selectors?: SliceSelectors<StateType>;
	};

export type TCreateFSMSlicerReturned<
	Actions extends string | number | symbol,
	State,
	Name extends string = string,
	ReducerPath extends string = Name,
	Selectors extends SliceSelectors<State> = SliceSelectors<State>,
> = ReturnType<typeof createSlice<State, TReducersFSMSlice<Actions, State>, Name, Selectors, ReducerPath>>;

export type TReducersFSMSlice<Actions extends string | number | symbol, State>
	= ValidateSliceCaseReducers<
		State,
		Record<Actions, CaseReducer<State, PayloadAction<Partial<State>>>>
	>;

export type TStateFSMSlice = {
	state: number | null;
	context: any;
};

export type TAutomataTypeStaticMethods = {
	id: string;
	actions: Record<string, string>;
	states: Record<string, string>;
	getState: (state: any) => any;
	hasState: (instance: any, state: any) => boolean;
	getAction: (action: any) => any;
	createAction: (action: any, payload: any) => any;
};

export type TAutomataWithStaticMethods = typeof GenericAutomata
	& TAutomataTypeStaticMethods;
