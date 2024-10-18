import {
	CaseReducer,
	Dispatch,
	PayloadAction,
	SliceSelectors,
	UnknownAction,
	ValidateSliceCaseReducers,
} from '@reduxjs/toolkit';
import {
	GenericAutomata,
	IAutomata,
	TAutomataBaseActionType,
	TAutomataBaseEventType,
	TAutomataBaseStateType,
	TAutomataStateContext,
} from '@yantrix/automata';
import { TClassConstructor } from '@yantrix/utils';

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
		contextToRedux?: (context: ContextType) => StateType;
		reducerPath?: string;
		selectors?: SliceSelectors<TAutomataContext<StateType>>;
	};

export type TReducersFSMSlice<Actions extends string | number | symbol, State>
	= ValidateSliceCaseReducers<
		State,
		Record<Actions, CaseReducer<State, PayloadAction<Partial<State>>>>
	>;

export type TAutomataContext<ContextType> = {
	state: number | null;
	context: ContextType;
};

export type TAutomata = IAutomata<
	TAutomataBaseStateType,
	TAutomataBaseActionType,
	TAutomataBaseEventType,
	Record<TAutomataBaseStateType, any>,
	Record<TAutomataBaseActionType, any>,
	Record<TAutomataBaseEventType, any>
>;
