import { IAutomataEventBus, IAutomataFunctionRegistry } from './interfaces';

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

/**
 * Represents the current state & associated context of the automata.
 *
 * @template StateType - The type of the automata state.
 * @template ContextType - The type of the context associated with each state.
 */
export type TAutomataStateContext<
	StateType extends TAutomataBaseStateType,
	ContextType extends { [K in StateType]: any },
> = TAutomataStateContainer<StateType> & {
	context: ContextType[StateType] | null;
};

/**
 * Represents the action for an automata, together with its payload.
 *
 * @template ActionType - The type of the automata action.
 * @template PayloadType - The type of the payload associated with each action.
 */
export type TAutomataActionPayload<
	ActionType extends TAutomataBaseActionType,
	PayloadType extends { [K in ActionType]: any },
> = TAutomataActionContainer<ActionType> & {
	payload: PayloadType[ActionType] | null;
};

/**
 * Represents the event that can be emitted or received by an automata.
 *
 * @template EventType - The type of the automata event.
 * @template EventMetaType - The type of the metadata associated with each event.
 */
export type TAutomataEventMetaType<
	EventType extends TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
> = TAutomataEventContainer<EventType> & {
	meta: EventMetaType[EventType] | null;
};

/**
 * Represents an event handler function for an automata.
 *
 * @template EventType - The type of the automata event.
 * @template ActionType - The type of the automata action.
 * @template EventMetaType - The type of the metadata associated with each event.
 * @template PayloadType - The type of the payload associated with each action.
 * @param event - The event metadata.
 * @returns The action(and its payload) that needs to be dispatched to the automata upon processing the event.
 */
export type TAutomataEventHandler<
	EventType extends TAutomataBaseEventType,
	ActionType extends TAutomataBaseActionType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
	PayloadType extends { [K in ActionType]: any } = Record<ActionType, any>,
> = (event: TAutomataEventMetaType<EventType, EventMetaType>) => TAutomataActionPayload<ActionType, PayloadType>;

/**
 * Represents an event emitter function for an automata.
 *
 * @template EventType - The type of the automata event.
 * @template StateType - The type of the automata state.
 * @template EventMetaType - The type of the metadata associated with each event.
 * @template ContextType - The type of the context associated with each state.
 * @param state - The current state of the automata.
 * @returns The event that needs to be emitted by the automata after executing a certain `Action`.
 */
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

/**
 * Represents a reducer function for an automata,
 * used for changing the state upon the dispatch of a certain `Action`.
 *
 * @template StateType - The type of the current automata state.
 * @template ActionType - The type of the automata action.
 * @template ContextType - The type of the context associated with each state.
 * @template PayloadType - The type of the payload associated with each action.
 * @template NewStateType - The type of the new state for the automata.
 * @param params - The event parameters.
 * @returns The new state that the automata should enter and its updated context.
 */
export type TAutomataReducer<
	StateType extends TAutomataBaseStateType,
	ActionType extends TAutomataBaseActionType,
	ContextType extends { [K in StateType]: any } = Record<StateType, any>,
	PayloadType extends { [K in ActionType]: any } = Record<ActionType, any>,
	NewStateType extends StateType = StateType,
> = (
	params: TAutomataEvent<StateType, ActionType, ContextType, PayloadType>,
) => TAutomataStateContext<NewStateType, ContextType>;

/**
 * Represents a dispatch function for an automata,
 * used for dispatching certain `Actions` to the automata to change its state.
 *
 * @template StateType - The type of the automata state.
 * @template ActionType - The type of the automata action.
 * @template ContextType - The type of the context associated with each state.
 * @template PayloadType - The type of the payload associated with each action.
 * @template NewStateType - The type of the new state after the dispatch.
 * @param action - The action payload.
 * @returns The new state of the automata and the updated context.
 */
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

/**
 * Represents a type with all properties defined and non-nullable.
 *
 * @template T - The type to transform.
 */
export type TDefinedValues<T> = T extends object
	? {
			[P in keyof T]: NonNullable<T[P]>;
		}
	: NonNullable<T>;

/**
 * Represents a validator function of the automata.
 * Used as a template for validating the automata state, action, event, or event metadata.
 *
 * @example
 * ```typescript
 * // Create an action validator for the automata:
 * const testValidator = ((a: number) => a % 15 === 0) as TValidator<TTestAction>;
 * sampleAutomataInstance.setActionValidator(testValidator);
 * ```
 *
 * @template T - The type of the validator.
 * @param x - The value to validate.
 */
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

/**
 * Represents a transformer function for the context of an automata state.
 * This transformer can be added to the `State Dictionary` of the automata.
 *
 * @template StateType - The type of the automata state.
 * @template ContextType - The type of the context associated with each state.
 * @param context - The current state (and context) of the automata.
 * @returns The transformed state (and context) of the automata.
 */
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

/**
 * Represents a task that will be processed by the event bus after emitting a certain `Event`.
 * Contains the ID of this task, as well as Promise for next events to be processed.
 * Returning null as a result of handler makes it synchronous.
 *
 * @template EventType - The type of the automata event.
 * @template EventMetaType - The type of the metadata associated with each event.
 */
export type TEventBusTask<
	EventType extends TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
> = TAutomataEventMetaType<EventType, EventMetaType> & {
	task_id: string;
	result: Promise<TAutomataEventStack<EventType, EventMetaType>> | null;
};

/**
 * Handler function for the event bus that transforms emitted events to event bus tasks.
 * Contains the ID of this task, as well as Promise for next events to be processed.
 * Returning null as a result of handler makes it synchronous.
 *
 * @template EventType - The type of the automata event.
 * @template EventMetaType - The type of the metadata associated with each event.
 * @param event - The event metadata.
 * @returns The event bus task.
 */
export type TEventBusHandler<
	EventType extends TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
> = (event: TAutomataEventMetaType<EventType, EventMetaType>) => TEventBusTask<EventType, EventMetaType>;

/**
 * Represents a function that can be used in the automata.
 */
export type TAutomataFunction = ((...args: any) => any) | null;

export type TCycleIteratorInfo = {
	currentCycle: number;
	totalCycles: number;
	currentEpoch: number;
};

export type TDataSourceConstructorOpts<T> = {
	id?: string;
	afterInit?: (
		id: string,
		publishMethod?: (data: T) => any,
		resetMethod?: () => T[]
	) => void;
};

export type TDataDestinationResolver<
	DataPacketType,
	ResolveResultType,
	ObjectType,
> = (data: DataPacketType, self?: ObjectType) => Promise<ResolveResultType>;
export type TDataDestinationConstructorOpts<DataPacketType, ResolveResultType, ObjectType> = {
	id?: string;
	resolver?: TDataDestinationResolver<DataPacketType, ResolveResultType, ObjectType> | null;
	afterInit?: (
		id?: string,
		setResolver?: (resolver: TDataDestinationResolver<DataPacketType, ResolveResultType, ObjectType>) => any
	) => void;
};

export type TDataDestinationOutput<DataPacketType, ResolveResultType, ErrorType> =
	{
		data: DataPacketType;
		result: ResolveResultType | null;
		error?: ErrorType;
	};

export const WILDCARD_EVENT = Symbol('wildcard_event');
export type TDataBoundSelector<
	EventType extends TAutomataBaseEventType,
	EventMetaType extends Record<EventType, any>,
	DataPacketType,
	DataModel,
> = (event: TAutomataEventMetaType<EventType, EventMetaType>, model?: DataModel) => DataPacketType | null;
export type TDataBoundEventDictionary<
	EventType extends TAutomataBaseEventType,
	EventMetaType extends Record<EventType, any>,
	DataPacketType,
	DataModel,
> = {
	[T in EventType]?: Array<TDataBoundSelector<T, EventMetaType, DataPacketType, DataModel>>
} & {
	[WILDCARD_EVENT]?: Array<TDataBoundSelector<EventType, EventMetaType, DataPacketType, DataModel>>;
};

export interface IEventSource<
	EventType extends TAutomataBaseEventType = TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
> {
	id?: string;
	/**
	 * Запуск источника. В колбэк publish следует отправлять готовые события для EventBus.
	 */
	start: (publish: (event: TAutomataEventMetaType<EventType, EventMetaType>) => void) => void;
	/**
	 * Остановка источника и очистка своих ресурсов.
	 */
	stop: () => void;
	/**
	 * (Необязательно) Набор типов событий, которые источник может публиковать.
	 */
	getObservedEvents?: () => EventType[];
}

export interface IEventDestination<
	EventType extends TAutomataBaseEventType = TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
> {
	id?: string;
	/**
	 * Привязка приемника к шине. Должна вернуть функцию отписки.
	 * Внутри можно подписаться на нужные события через bus.subscribe(...)
	 */
	bind: (bus: IAutomataEventBus<EventType, EventMetaType>) => TSubscriptionCancelFunction;
}
