import {
	GenericAutomata,
	IAutomata,
	TAutomataBaseActionType,
	TAutomataBaseEventType,
	TAutomataBaseStateType,
	TAutomataStateContext,
} from '@yantrix/automata';
import {
	CaseReducer,
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

export type TReduxConnectedAutomata =
	Record<TAutomataId, TConnectedAutomataOptions>;

export type TCreateFSMSliceOptions<Automata extends TAutomata, StateType, ContextType = object>
	= {
		name: string;
		Fsm: TClassConstructor<Automata>;
		contextToRedux?: (context?: ContextType) => StateType;
		reducerPath?: string;
		selectors?: SliceSelectors<TStateFSMSlice<StateType>>;
	};

export type TReducersFSMSlice<Actions extends string | number | symbol, State>
	= ValidateSliceCaseReducers<
		State,
		Record<Actions, CaseReducer<State, PayloadAction<Partial<State>>>>
	>;

export type TStateFSMSlice<ContextType> = {
	state: number | null;
	context: ContextType;
};

export interface IAutomataTypeStaticMethods {
	id: string;
	actions: Record<string, string>;
	states: Record<string, string>;
	getState: (state: any) => any;
	hasState: (instance: any, state: any) => boolean;
	getAction: (action: any) => any;
	createAction: (action: any, payload: any) => any;
};

export type TAutomataWithStaticMethods = TAutomata
	& IAutomataTypeStaticMethods;

export type TClassConstructor<C extends TAutomata> = {
	id: string;
	actions: Record<string, string>;
	states: Record<string, string>;
	getState: (state: any) => any;
	hasState: (instance: any, state: any) => boolean;
	getAction: (action: any) => any;
	createAction: (action: any, payload: any) => any;
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
