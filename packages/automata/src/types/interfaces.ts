import {
	TActionDictionaryMapping,
	TActionKeysCollection,
	TActionLookupParams,
	TActionValuesCollection,
	TStateDictionaryMapping,
	TStateKeysCollection,
	TStateLookupParams,
	TStateValuesCollection,
} from './dictionaries.js';
import {
	TAutomataActionPayload,
	TAutomataBaseActionType,
	TAutomataBaseEventType,
	TAutomataBaseStateType,
	TAutomataDispatch,
	TAutomataEffect,
	TAutomataEventEmitter,
	TAutomataEventHandler,
	TAutomataEventMetaType,
	TAutomataEventStack,
	TAutomataParams,
	TAutomataQueue,
	TAutomataReducer,
	TAutomataStateContext,
	TContextTransformer,
	TEventBusHandler,
	TSubscriptionCancelFunction,
	TValidator,
} from './index.js';

export interface IAutomataEventContainer<
	EventType extends TAutomataBaseEventType,
> {
	validateEvent: TValidator<EventType>;

	setEventValidator(eventValidator?: TValidator<EventType>): this;
}

export interface IAutomataStateContainer<
	StateType extends TAutomataBaseStateType,
> {
	validateState: TValidator<StateType>;

	setStateValidator(stateValidator?: TValidator<StateType>): this;
}

export interface IAutomataActionContainer<
	ActionType extends TAutomataBaseActionType,
> {
	validateAction: TValidator<ActionType>;

	setActionValidator(actionValidator?: TValidator<ActionType> | null): this;
}

export interface IAutomataValidatorContainer<
	StateType extends TAutomataBaseStateType,
	ActionType extends TAutomataBaseActionType,
	EventType extends TAutomataBaseEventType,
> extends IAutomataEventContainer<EventType>,
		IAutomataStateContainer<StateType>,
		IAutomataActionContainer<ActionType> {}

export interface IAutomataExtendedActionContainer<
	ActionType extends TAutomataBaseActionType,
	PayloadType extends { [K in ActionType]: any },
> extends IAutomataActionContainer<ActionType> {
	validateActionPayload: TValidator<
		TAutomataActionPayload<ActionType, PayloadType>
	>;

	setActionPayloadValidator(
		actionPayloadValidator?: TValidator<
			TAutomataActionPayload<ActionType, PayloadType>
		>,
	): this;
}

export interface IAutomataExtendedStateContainer<
	StateType extends TAutomataBaseStateType,
	ContextType extends { [K in StateType]: any },
> extends IAutomataStateContainer<StateType> {
	validateContext: TValidator<TAutomataStateContext<StateType, ContextType>>;

	setContextValidator(
		contextValidator?: TValidator<
			TAutomataStateContext<StateType, ContextType>
		>,
	): this;
}

export interface IAutomataExtendedEventContainer<
	EventType extends TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any },
> extends IAutomataEventContainer<EventType> {
	validateEventMeta: TValidator<
		TAutomataEventMetaType<EventType, EventMetaType>
	>;

	setEventMetaValidator(
		eventMetaValidator?: TValidator<
			TAutomataEventMetaType<EventType, EventMetaType>
		>,
	): this;
}

export interface IAutomataExtendedValidatorContainer<
	StateType extends TAutomataBaseStateType,
	ActionType extends TAutomataBaseActionType,
	EventType extends TAutomataBaseEventType,
	ContextType extends { [K in StateType]: any },
	PayloadType extends { [K in ActionType]: any },
	EventMetaType extends { [K in EventType]: any },
> extends IAutomataValidatorContainer<StateType, ActionType, EventType>,
		IAutomataExtendedActionContainer<ActionType, PayloadType>,
		IAutomataExtendedEventContainer<EventType, EventMetaType>,
		IAutomataExtendedStateContainer<StateType, ContextType> {}

export interface IAutomataEventAdapter<
	StateType extends TAutomataBaseStateType,
	ActionType extends TAutomataBaseActionType,
	EventType extends TAutomataBaseEventType,
	ContextType extends { [K in StateType]: any } = Record<StateType, any>,
	PayloadType extends { [K in ActionType]: any } = Record<ActionType, any>,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
> extends IAutomataValidatorContainer<StateType, ActionType, EventType> {
	addEventListener: <T extends EventType>(
		type: T,
		handler: TAutomataEventHandler<
			T,
			ActionType,
			EventMetaType,
			PayloadType
		>,
	) => null | TSubscriptionCancelFunction;
	addEventEmitter: <T extends StateType>(
		on: T,
		emitter: TAutomataEventEmitter<
			EventType,
			T,
			EventMetaType,
			ContextType
		>,
	) => null | TSubscriptionCancelFunction;
	handleEvent: <T extends EventType>(
		event: TAutomataEventMetaType<T, EventMetaType>,
	) => Array<
		ReturnType<
			TAutomataEventHandler<T, ActionType, EventMetaType, PayloadType>
		>
	>;
	handleTransition: <T extends StateType>(
		newState: TAutomataStateContext<T, ContextType>,
	) => Array<
		ReturnType<
			TAutomataEventEmitter<EventType, T, EventMetaType, ContextType>
		>
	>;
	removeAllListeners: <T extends EventType>(type: T | null) => this;
	removeAllEmitters: <T extends StateType>(type: T | null) => this;
	getObservedEvents: () => EventType[];
	getObservedStates: () => StateType[];
}

export interface IAutomata<
	StateType extends TAutomataBaseStateType,
	ActionType extends TAutomataBaseActionType,
	EventType extends TAutomataBaseEventType,
	ContextType extends {
		[K in StateType]: any;
	} = Record<StateType, any>,
	PayloadType extends { [K in ActionType]: any } = Record<ActionType, any>,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
> extends TAutomataStateContext<StateType, ContextType>,
		IAutomataValidatorContainer<StateType, ActionType, EventType> {
	eventAdapter: IAutomataEventAdapter<
		StateType,
		ActionType,
		EventType,
		ContextType,
		PayloadType,
		EventMetaType
	> | null;

	/**
	 * Reset the Instance and provide a Reducer, new State and optionally Validators
	 */
	init: (
		params: TAutomataParams<
			StateType,
			ActionType,
			EventType,
			ContextType,
			PayloadType,
			EventMetaType
		>,
	) => this;

	/**
	 * Return current Reducer function
	 */
	getReducer: () => TAutomataReducer<
		StateType,
		ActionType,
		ContextType,
		PayloadType
	> | null;

	/**
	 * When the Instance is Disabled, Consuming Actions doesn't change the internal state
	 */
	enable: () => this;
	disable: (clearQueue?: boolean) => this;
	isEnabled: () => boolean;

	/**
	 * When the Instance is Paused, dispatched Actions aren't Consumed, but put into the Queue instead
	 */
	isPaused: () => boolean;

	pause: () => this;
	/**
	 * Resuming will Collapse the Queue, unless the Instance is Disabled
	 */
	resume: () => this;

	/**
	 * Returns internal State and Context of the Instance
	 */
	getContext: <K extends StateType = StateType>() => TAutomataStateContext<
		K,
		ContextType
	>;

	/**
	 * Consume all Actions in the Queue and return the resulting State
	 * Works even when Paused
	 * When Disabled, consumed Actions don't change the internal State
	 * Returns the final result of all consumed Actions
	 */
	collapseActionQueue: () => {
		actions: TAutomataQueue<ActionType, PayloadType> | null;
		newState: TAutomataStateContext<StateType, ContextType>;
	};

	getActionQueue: () => TAutomataQueue<ActionType, PayloadType>;
	clearActionQueue: () => this;

	/**
	 * Pop at most [count] Actions from the Queue and Consume them
	 * Works even when Paused
	 * When Disabled, consumed Actions don't change the internal State
	 * Returns the final result of all consumed Actions
	 * @param count Number of Actions to consume, defaults to 1
	 */
	consumeAction: (count: number) => {
		action: TAutomataActionPayload<ActionType, PayloadType> | null;
		newState: TAutomataStateContext<StateType, ContextType>;
	};

	/**
	 * Consume Action and return the new State and its context
	 * The Queue is Collapsed beforehand, if not Disabled
	 * When Paused, puts an Action into the Queue instead
	 * When Disabled, doesn't change the internal State
	 * Returns the final result of all Actions, including the Queue
	 */
	dispatch: TAutomataDispatch<
		StateType,
		ActionType,
		ContextType,
		PayloadType
	>;
}

export interface IStateDictionary<
	StateType extends TAutomataBaseStateType,
	ContextType extends {
		[K in StateType]: any;
	} = Record<StateType, any>,
> extends IAutomataExtendedStateContainer<StateType, ContextType> {
	/**
	 * Get Keys for selected States, possibly scoped to namespace
	 * @param {states:StateType[],namespace?:string} states
	 * @return {string[]}
	 */
	getStateKeys: (
		states: TStateValuesCollection<StateType>,
	) => Array<string | null>;

	/**
	 * Get all States for selected Keys, possibly scoped to namespace
	 * @param {keys:string[],namespace?:string} states
	 * @return {string[]}
	 */
	getStateValues: (
		states: TStateKeysCollection<StateType>,
	) => Array<StateType | null>;
	/**
	 * add new string States to the Dictionary, possibly within namespace
	 * @param {states:string[],namespace?:string} states
	 * @return new States' values
	 */
	addStates: (params: TStateKeysCollection<StateType>) => StateType[];
	/**
	 * remove States from the Dictionary, possibly scoping them to namespace.
	 * @param {TStateLookupParams<StateType>} Search states: Namespace and States or Keys to remove
	 * @param  {boolean} removeContextTransformers if true, also remove Context Transformers for removed States
	 * @return {this}
	 */
	removeStates: (
		params: TStateLookupParams<StateType>,
		removeContextTransformers?: boolean,
	) => this;

	/**
	 * remove all States from the Dictionary, possibly scoping them to namespace.
	 * @return {this}
	 */
	clearStates: (namespace?: string) => this;

	/**
	 * Get all mapped State Types with their corresponding Keys, possibly filtered by Namespace
	 * @return {TStateDictionaryMapping<StateType>}
	 */
	getDictionary: (namespace?: string) => TStateDictionaryMapping<StateType>;

	/**
	 * add a Context Transformer for a particular State, possibly scoped to namespace
	 * @param {TContextTransformer} transformer to add
	 * @param [string] namespace
	 * @returns {string} transformer ID
	 */
	addContextTransformer: <T extends StateType>(
		state: T,
		transformer: TContextTransformer<T, ContextType>,
		namespace?: string,
	) => string;

	/**
	 * remove a Context Transformer for a particular State, possibly scoped to namespace
	 * @param {T} state
	 * @param {TContextTransformer<T, ContextType>} transformer to remove
	 * @param {string} namespace
	 * @return {this}
	 */
	removeContextTransformer: <T extends StateType>(
		state: T,
		transformer: TContextTransformer<T, ContextType>,
		namespace?: string,
	) => this;

	/**
	 * remove a Context Transformer by ID
	 * @param {string} id
	 * @return {this}
	 */
	removeContextTransformerById: (id: string) => this;

	/**
	 * Get all Context Transformers grouped by a particular State, possibly scoped to namespace
	 * @param {string} namespace
	 * @return {Partial<{[K in StateType]: Record<string, TContextTransformer<K, ContextType>>}>}
	 */
	getContextTransformers: (namespace?: string) => Partial<{
		[K in StateType]: Record<string, TContextTransformer<K, ContextType>>;
	}>;

	/**
	 * Run all Context Transformers for a particular State, possibly scoped to namespace
	 * @param {string} Transformer ID
	 * @param {TAutomataStateContext<T, ContextType>} context
	 * @return {TAutomataStateContext<StateType, ContextType>}
	 */
	runContextTransformers: <T extends StateType>(
		id: string,
		context: TAutomataStateContext<T, ContextType>,
	) => TAutomataStateContext<StateType, ContextType>;
}

export interface IActionDictionary<
	ActionType extends TAutomataBaseActionType,
	PayloadType extends { [K in ActionType]: any },
> extends IAutomataExtendedActionContainer<ActionType, PayloadType> {
	/**
	 * Add new Actions to the dictionary, possibly scope them to namespace
	 * @param {keys:string[],namespace?:string} actions
	 * @return {ActionType[]} a list of Keys for newly added Actions
	 */
	addActions: (actions: TActionKeysCollection<ActionType>) => ActionType[];

	/**
	 * Get Keys of selected Actions, possibly scoped to namespace
	 * @param {actions:ActionType[],namespace?:string} actions
	 * @return {string[], null if not found}
	 */
	getActionKeys: (
		actions: TActionValuesCollection<ActionType>,
	) => Array<string | null>;

	/**
	 * Get all Actions for selected Keys, possibly scoped to namespace
	 * @param {keys:string[],namespace?:string} actions
	 * @return {Action[]}
	 */
	getActionValues: (
		actions: TActionKeysCollection<ActionType>,
	) => Array<ActionType | null>;

	/**
	 * remove Actions from the Dictionary, possibly scoping them to namespace.
	 * @param {TActionLookupParams<ActionType>} Search actions: Namespace and Actions or Keys to remove
	 * @return {this}
	 */
	removeActions: (actions: TActionLookupParams<ActionType>) => this;

	/**
	 * remove all Actions from the Dictionary, possibly scoping them to namespace.
	 * @param {string} namespace
	 * @return {this}
	 */
	clearActions: (namespace?: string) => this;

	/**
	 * Get all mapped Action Types with their corresponding Keys, possibly filtered by Namespace
	 * @param {string} namespace
	 * @return {[string]:Action}
	 */
	getDictionary: (namespace?: string) => TActionDictionaryMapping<ActionType>;
}

export interface IAutomataSlice<
	EventType extends TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
	ModelType extends object = Record<string, any>,
> extends IAutomataEventContainer<EventType> {
	getMachines: Record<string, IAutomata<any, any, EventType>>;
	addMachine: <
		StateType extends TAutomataBaseStateType,
		ActionType extends TAutomataBaseActionType,
		ContextType extends { [K in StateType]: any } = Record<StateType, any>,
		PayloadType extends { [K in ActionType]: any } = Record<
			ActionType,
			any
		>,
	>(
		machineId: string,
		automata: IAutomata<
			StateType,
			ActionType,
			EventType,
			ContextType,
			PayloadType,
			EventMetaType
		>,
	) => this;
	removeMachine: (machineId: string) => this;
	getCompositeState: Record<string, TAutomataStateContext<any, any>>;

	restoreState: <
		StateType extends TAutomataBaseStateType,
		ContextType extends { [K in StateType]: any } = Record<StateType, any>,
	>(
		machineId: string,
		state: TAutomataStateContext<StateType, ContextType>,
	) => this;

	restoreCompositeState: (
		compositeState: Record<string, TAutomataStateContext<any, any>>,
	) => this;
	getEventMatrix: () => Record<
		EventType,
		Array<TAutomataEffect<ModelType, EventType>>
	>;
	dispatchEvent: (
		event: TAutomataEventMetaType<EventType, EventMetaType>,
	) => this;
	start: () => this;
	stop: (clearStack: boolean) => this;
	isRunning: () => boolean;
	getEventStack: () => TAutomataEventStack<EventType, EventMetaType>;
	clearEventStack: () => this;
	consumeEvent: () => {
		events: TAutomataEventStack<EventType, EventMetaType>;
		effects: Array<TAutomataEffect<ModelType, EventType>>;
	};
	getEventEffects: (
		event: EventType,
	) => Array<TAutomataEffect<ModelType, EventType>>;
}

export interface IAutomataEventBus<
	EventType extends TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
> extends IAutomataExtendedEventContainer<EventType, EventMetaType> {
	subscribe: (
		event: EventType,
		callback: TEventBusHandler<EventType, EventMetaType>,
	) => this;
	unsubscribe: (
		event: EventType,
		callback: null | TEventBusHandler<EventType, EventMetaType>,
	) => this;
	dispatch: (
		...events: TAutomataEventStack<EventType, EventMetaType>
	) => this;
	getEventStack: () => TAutomataEventStack<EventType, EventMetaType>;
	clearEventStack: () => this;
	pause: () => this;
	resume: () => this;
	isRunning: () => boolean;
	processEvents: () => TAutomataEventStack<EventType, EventMetaType>;
}
