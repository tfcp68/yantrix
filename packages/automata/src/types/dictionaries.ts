import { TAutomataBaseActionType, TAutomataBaseStateType } from './index.js';

export type TStateDictionaryMapping<StateType extends TAutomataBaseStateType> =
	Record<string, StateType>;
export type TActionDictionaryMapping<
	ActionType extends TAutomataBaseActionType
> = Record<string, ActionType>;

export type TStateKeysCollection<StateType extends TAutomataBaseStateType> = {
	keys: string[];
	namespace?: string;
};

export type TStateValuesCollection<StateType extends TAutomataBaseStateType> = {
	states: StateType[];
	namespace?: string;
};

export type TStateLookupParams<StateType extends TAutomataBaseStateType> =
	TStateKeysCollection<StateType> & TStateValuesCollection<StateType>;

export type TActionKeysCollection<ActionType extends TAutomataBaseActionType> =
	{
		keys: Array<null | string>;
		namespace?: string;
	};

export type TActionValuesCollection<
	ActionType extends TAutomataBaseActionType
> = {
	actions: Array<null | number>;
	namespace?: string;
};

export type TActionLookupParams<ActionType extends TAutomataBaseActionType> =
	Partial<
		TActionKeysCollection<ActionType> & TActionValuesCollection<ActionType>
	>;
