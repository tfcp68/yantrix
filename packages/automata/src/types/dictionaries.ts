import { TAutomataBaseActionType, TAutomataBaseEventType, TAutomataBaseStateType } from './index.js';

export type TStateDictionaryMapping<StateType extends TAutomataBaseStateType> = Record<string, StateType>;
export type TActionDictionaryMapping<ActionType extends TAutomataBaseActionType> = Record<string, ActionType>;
export type TEventDictionaryMapping<EventType extends TAutomataBaseEventType> = Record<string, EventType>;

export type TStateKeysCollection<StateType extends TAutomataBaseStateType> = {
	keys: string[];
	namespace?: string;
	states?: StateType[];
};

export type TStateValuesCollection<StateType extends TAutomataBaseStateType> = {
	states: StateType[];
	namespace?: string;
};

export type TStateLookupParams<StateType extends TAutomataBaseStateType> = TStateKeysCollection<StateType> &
	TStateValuesCollection<StateType>;

export type TActionKeysCollection<ActionType extends TAutomataBaseActionType> = {
	keys: Array<null | string>;
	namespace?: string;
	actions?: ActionType[];
};

export type TActionValuesCollection<ActionType extends TAutomataBaseActionType> = {
	actions: ActionType[];
	namespace?: string;
};

export type TActionLookupParams<ActionType extends TAutomataBaseActionType> = Partial<
	TActionKeysCollection<ActionType> & TActionValuesCollection<ActionType>
>;

export type TEventKeysCollection<EventType extends TAutomataBaseEventType> = {
	keys: Array<null | string>;
	namespace?: string;
	events?: EventType[];
};

export type TEventValuesCollection<EventType extends TAutomataBaseEventType> = {
	events: EventType[];
	namespace?: string;
};

export type TEventLookupParams<EventType extends TAutomataBaseEventType> = Partial<
	TEventKeysCollection<EventType> & TEventValuesCollection<EventType>
>;
