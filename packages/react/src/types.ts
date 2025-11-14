import {
	IAutomata,
	TAutomataActionPayload,
	TAutomataBaseActionType,
	TAutomataBaseEventType,
	TAutomataBaseStateType,
	TAutomataStateContext,
	TClassConstructor,
	TStaticMethods,
} from '@yantrix/core';

export type TUseFSMProps = {
	Automata: TAutomataConstructorWithStatic;
	id: string;
};

export type TAutomata = IAutomata<
	TAutomataBaseStateType,
	TAutomataBaseActionType,
	TAutomataBaseEventType,
	Record<TAutomataBaseStateType, any>,
	Record<TAutomataBaseActionType, any>,
	Record<TAutomataBaseEventType, any>
>;

export type TAutomataConstructorWithStatic = TClassConstructor<TAutomata> & TStaticMethods;

export type TTraceTransaction<
	StateType extends TAutomataBaseStateType,
	ActionType extends TAutomataBaseActionType,
	ContextType extends { [K in StateType]: any } = { [K in StateType]: any },
	PayloadType extends { [K in ActionType]: any } = { [K in ActionType]: any },
> = {
	lastPayload: TAutomataActionPayload<ActionType, PayloadType>;
	previousContext: TAutomataStateContext<StateType, ContextType>;
	timestamp: Date;
	id: string;
	stack?: Error['stack'];
};

export interface IUnsubscribe {
	(): void;
}

export type TListenerCallback = () => void;

export interface IYantrixBoundStore<Snapshot = TAutomata> {
	callbacksIdCounter: number;
	callbacks: Map<number, TListenerCallback>;
	subscribe: (listener: TListenerCallback) => IUnsubscribe;
	getSnapshot: () => Snapshot; // throws if not initialized
	changeState: () => void; // notify subscribers for this id
}

export interface IContextFSM {
	initializeFSM: (Automata: TUseFSMProps | TAutomataConstructorWithStatic) => string;
	getStore: (id: string) => IYantrixBoundStore;
}

export type TUseFsmReturn = {
	state: TAutomataBaseStateType | null;
	getContext: () => any;
	dispatch: <ActionType extends TAutomataBaseActionType, PayloadType extends { [K in ActionType]: any }>(
		action: TAutomataActionPayload<ActionType, PayloadType>,
	) => void;
	trace: () => TTraceTransaction<TAutomataBaseStateType, TAutomataBaseActionType>;
	getInstanceAutomata: () => TAutomata;
	getAutomatasList: () => Record<string, TAutomata>;
} & TStaticMethods;

export type TUseFsmReturnWithSelection<Selection> = TUseFsmReturn & {
	selection: Selection;
};

export type TPreviousContext = {
	state: number | null;
	context: Record<string, any>;
};

export type TUseFSMOptions<Snapshot, Selection> = {
	selector: (snapshot: Snapshot, statics: TStaticMethods) => Selection;
	isEqual?: (a: Selection, b: Selection) => boolean;
};

export type TRef<T> = { current: T };
