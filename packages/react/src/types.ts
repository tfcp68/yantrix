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

export type TAutomata = IAutomata<
	TAutomataBaseStateType,
	TAutomataBaseActionType,
	TAutomataBaseEventType,
	Record<TAutomataBaseStateType, any>,
	Record<TAutomataBaseActionType, any>,
	Record<TAutomataBaseEventType, any>
>;

export type TAutomataConstructorWithStatic = TClassConstructor<TAutomata> & TStaticMethods;

export type TUseFSMInput = TAutomata & { correlationId: string };

/** Snapshot of a single dispatch for debugging via the trace() call. */
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

/** External store bound to a single FSM instance. Used internally by {@link useFSM}. */
export interface IYantrixBoundStore<Snapshot = TAutomata> {
	callbacksIdCounter: number;
	callbacks: Map<number, TListenerCallback>;
	subscribe: (listener: TListenerCallback) => IUnsubscribe;
	getSnapshot: () => Snapshot; // throws if not initialized
	changeState: () => void; // notify subscribers for this id
}

export interface IContextFSM {
	initializeFSM: (inst: TUseFSMInput) => string;
	getStore: (id: string) => IYantrixBoundStore;
	destroyFSM: (id: string) => void;
}

export type TExtractAutomataContext<T> =
	T extends { getContext: () => { context: infer C } } ? C : unknown;

export type TUseFsmGetContext<TContext> = () => {
	state: TAutomataBaseStateType | null;
	context: TContext;
};

/** Return value of {@link useFSM}. Provides reactive state, dispatch, and debug utilities. */
export type TUseFsmReturn<TContext = unknown> = {
	state: TAutomataBaseStateType | null;
	getContext: TUseFsmGetContext<TContext>;
	dispatch: <ActionType extends TAutomataBaseActionType, PayloadType extends { [K in ActionType]: any }>(
		action: TAutomataActionPayload<ActionType, PayloadType>,
	) => void;
	trace: () => TTraceTransaction<TAutomataBaseStateType, TAutomataBaseActionType>;
	getInstanceAutomata: () => {
		id: string;
		Automata: TAutomata;
	};
	getAutomatasList: () => Record<string, TAutomata>;
} & TStaticMethods;

export type TUseFsmReturnWithSelection<Selection, TContext> = TUseFsmReturn<TContext> & {
	selection: Selection;
};

export type TPreviousContext<Context = any> = {
	state: number | null;
	context: Record<string, Context>;
};

export type TUseFSMOptions<Snapshot, Selection> = {
	selector: (snapshot: Snapshot, statics: TStaticMethods) => Selection;
	isEqual?: (a: Selection, b: Selection) => boolean;
};

export type TRef<T> = { current: T };

export type TAutomataList = {
	[key: string]: TAutomata;
};
