import { IAutomataFunctionRegistry } from './interfaces';

/**
 * Represents the base state type for the automata.
 */
export type TAutomataBaseStateType = number;

/**
 * Represents the base action type for the automata.
 */
export type TAutomataBaseActionType = number;

/**
 * Represents the base event type for the automata.
 */
export type TAutomataBaseEventType = number;

export interface IBaseClass {
	next?: () => this;
	correlationId: string;
}

export type TAbstractConstructor<T = object> = new (...args: any[]) => T;

export type TAbstractFunction<T = any> = (...args: any[]) => T;

export type TMixin<T extends TAbstractFunction> = InstanceType<ReturnType<T>>;

export type TMergeClassTrait<TTrait extends TAbstractConstructor, TTarget extends TAbstractConstructor> = (new (
	...a: ConstructorParameters<TTarget>
) => InstanceType<TTrait> & InstanceType<TTarget>) &
Pick<TTarget, keyof TTarget> &
Pick<TTrait, keyof TTrait>;

/**
 * Container for automata state.
 */
export type TAutomataStateContainer<StateType extends TAutomataBaseStateType> = {
	state: StateType | null;
};

/**
 * Container for automata action.
 */
export type TAutomataActionContainer<ActionType extends TAutomataBaseActionType> = {
	action: ActionType | null;
};

/**
 * Container for automata event.
 */
export type TAutomataEventContainer<EventType extends TAutomataBaseEventType> = {
	event: EventType | null;
};

export type TAutomataStateContext<
	StateType extends TAutomataBaseStateType,
	ContextType extends { [K in StateType]: any },
> = TAutomataStateContainer<StateType> & {
	context: ContextType[StateType] | null;
};

export type TAutomataActionPayload<
	ActionType extends TAutomataBaseActionType,
	PayloadType extends { [K in ActionType]: any },
> = TAutomataActionContainer<ActionType> & {
	payload: PayloadType[ActionType] | null;
};

export type TAutomataEventMetaType<
	EventType extends TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
> = TAutomataEventContainer<EventType> & {
	meta: EventMetaType[EventType] | null;
};

export type TAutomataEventHandler<
	EventType extends TAutomataBaseEventType,
	ActionType extends TAutomataBaseActionType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
	PayloadType extends { [K in ActionType]: any } = Record<ActionType, any>,
> = (event: TAutomataEventMetaType<EventType, EventMetaType>) => TAutomataActionPayload<ActionType, PayloadType>;

export type TAutomataEventEmitter<
	EventType extends TAutomataBaseEventType,
	StateType extends TAutomataBaseStateType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
	ContextType extends { [K in StateType]: any } = Record<StateType, any>,
> = (state: TAutomataStateContext<StateType, ContextType>) => TAutomataEventMetaType<EventType, EventMetaType>;

export type TAutomataEvent<
	StateType extends TAutomataBaseStateType,
	ActionType extends TAutomataBaseActionType,
	ContextType extends { [K in StateType]: any } = Record<StateType, any>,
	PayloadType extends { [K in ActionType]: any } = Record<ActionType, any>,
> = TAutomataStateContext<StateType, ContextType> & TAutomataActionPayload<ActionType, PayloadType>;

export type TAutomataReducer<
	StateType extends TAutomataBaseStateType,
	ActionType extends TAutomataBaseActionType,
	ContextType extends { [K in StateType]: any } = Record<StateType, any>,
	PayloadType extends { [K in ActionType]: any } = Record<ActionType, any>,
	NewStateType extends StateType = StateType,
> = (
	params: TAutomataEvent<StateType, ActionType, ContextType, PayloadType>,
) => TAutomataStateContext<NewStateType, ContextType>;

export type TAutomataDispatch<
	StateType extends TAutomataBaseStateType,
	ActionType extends TAutomataBaseActionType,
	ContextType extends { [K in StateType]: any } = Record<StateType, any>,
	PayloadType extends { [K in ActionType]: any } = Record<ActionType, any>,
	NewStateType extends StateType = StateType,
> = (
	action: TAutomataActionPayload<ActionType, PayloadType>,
) => ReturnType<TAutomataReducer<StateType, ActionType, ContextType, PayloadType, NewStateType>>;

export type TSubscriptionCancelFunction = () => void;

export type TDefinedValues<T> = T extends object
	? {
			[P in keyof T]: NonNullable<T[P]>;
		}
	: NonNullable<T>;

export type TValidator<T> = (x: any) => x is TDefinedValues<T>;

/**
 * Parameters for automata configuration.
 */
export type TAutomataParams<
	StateType extends TAutomataBaseStateType,
	ActionType extends TAutomataBaseActionType,
	EventType extends TAutomataBaseEventType,
	ContextType extends {
		[K in StateType]: any;
	} = Record<StateType, any>,
	PayloadType extends { [K in ActionType]: any } = Record<ActionType, any>,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
> = TAutomataStateContext<StateType, ContextType> & {
	rootReducer: TAutomataReducer<StateType, ActionType, ContextType, PayloadType> | null;
	stateValidator?: TValidator<StateType>;
	actionValidator?: TValidator<ActionType>;
	eventValidator?: TValidator<EventType>;
	eventMetaValidator?: TValidator<EventMetaType>;
	functionRegistry?: IAutomataFunctionRegistry;
	enabled?: boolean;
	paused?: boolean;
};

/**
 * Queue for automata actions.
 */
export type TAutomataQueue<
	ActionType extends TAutomataBaseActionType,
	PayloadType extends { [K in ActionType]: any } = Record<ActionType, any>,
> = Array<TAutomataActionPayload<ActionType, PayloadType>>;

/**
 * Stack for automata events.
 */
export type TAutomataEventStack<
	EventType extends TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
> = Array<TAutomataEventMetaType<EventType, EventMetaType>>;

/**
 * Effect function for automata model.
 */
export type TAutomataEffect<
	ModelType extends object,
	EventType extends TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
> = (event: EventMetaType, model: ModelType) => ModelType;

export type TGenericTransformer<DataType> = (data: DataType) => DataType;

export type TContextTransformer<
	StateType extends TAutomataBaseStateType,
	ContextType extends {
		[K in StateType]: any;
	} = Record<StateType, any>,
> = (context: TAutomataStateContext<StateType, ContextType>) => TAutomataStateContext<StateType, ContextType>;

export type TContextPredicate<
	StateType extends TAutomataBaseStateType,
	ContextType extends {
		[K in StateType]: any;
	} = Record<StateType, any>,
> = (context: TAutomataStateContext<StateType, ContextType>) => THighOrderPredicate;

export type TModelPredicate<ModelType extends object = Record<string, any>> = (model: ModelType) => THighOrderPredicate;

export type THighOrderPredicate = (...predicates: Array<(...args: any[]) => boolean>) => boolean;

export type TEventBusTask<
	EventType extends TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
> = TAutomataEventMetaType<EventType, EventMetaType> & {
	task_id: string;
	result: Promise<TAutomataEventStack<EventType, EventMetaType>>;
};

export type TEventBusHandler<
	EventType extends TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
> = (event: TAutomataEventMetaType<EventType, EventMetaType>) => TEventBusTask<EventType, EventMetaType>;

export type TAutomataFunction = ((...args: any) => any) | null;
