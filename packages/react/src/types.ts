import {
	IAutomata,
	TAutomataActionPayload,
	TAutomataBaseActionType,
	TAutomataBaseEventType,
	TAutomataBaseStateType,
	TAutomataStateContext,
} from '@yantrix/automata';
import { TClassConstructor, TStaticMethods } from '@yantrix/utils';

export type TUseFSMProps<Automata extends TAutomata> = {
	Automata: TClassConstructor<Automata>;
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

export interface IContextFSM<Snapshot = TAutomata> {
	callbacksIdCounter: number;
	callbacks: Map<any, TListenerCallback>;
	subscribe: (listener: TListenerCallback) => IUnsubscribe;
	getSnapshot: () => Snapshot;
	changeState: (newState: Snapshot) => void;
	state: Snapshot;

	/**
	 * @description Инициализируцет автомат в зависимости от типа, переданного в хук и возвращает id автомата
	 * @param Automata
	 * @return string
	 */
	initializeFSM: (Automata: TUseFSMProps<TAutomata> | TClassConstructor<TAutomata>) => string;

	/**
	 * Добавляет новый автомат, если автомата с данным id еще не существует
	 * @param id
	 * @param Automata
	 */
	changeAutomatas: (id: string, Automata: TClassConstructor<TAutomata>) => void;
};

export type TUseFsmReturn = {
	state: TAutomataBaseStateType;
	getContext: () => any;
	dispatch: <ActionType extends number, PayloadType extends { [K in ActionType]: any }>
	(action: TAutomataActionPayload<ActionType, PayloadType>
	) => void;
	trace: () => TTraceTransaction<TAutomataBaseStateType, TAutomataBaseActionType>;
	getInstanceAutomata: () => TAutomata | undefined;
	getAutomatasList: () => Record<string, TAutomata>;
} & TStaticMethods;

export type TPreviousContext = {
	state: number | null;
	context: Record<string, any>;
};

export type TUseFSMOptions<Snapshot, Selection> = {
	selector: (snapshot: Snapshot) => Selection;
	isEqual?: (a: Selection, b: Selection) => boolean;
};
