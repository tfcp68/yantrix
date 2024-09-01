import {
	TActionDictionaryMapping,
	TActionKeysCollection,
	TActionLookupParams,
	TActionValuesCollection,
	TEventDictionaryMapping,
	TEventKeysCollection,
	TEventLookupParams,
	TEventValuesCollection,
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

export interface IAutomataEventContainer<EventType extends TAutomataBaseEventType> {
	validateEvent: TValidator<EventType>;

	setEventValidator: (eventValidator?: TValidator<EventType>) => this;
}

export interface IAutomataStateContainer<StateType extends TAutomataBaseStateType> {
	validateState: TValidator<StateType>;

	setStateValidator: (stateValidator?: TValidator<StateType>) => this;
}

export interface IAutomataActionContainer<ActionType extends TAutomataBaseActionType> {
	validateAction: TValidator<ActionType>;

	setActionValidator: (actionValidator?: TValidator<ActionType> | null) => this;
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
	validateActionPayload: TValidator<TAutomataActionPayload<ActionType, PayloadType>>;

	setActionPayloadValidator: (
		actionPayloadValidator?: TValidator<TAutomataActionPayload<ActionType, PayloadType>>,
	) => this;
}

export interface IAutomataExtendedStateContainer<
	StateType extends TAutomataBaseStateType,
	ContextType extends { [K in StateType]: any },
> extends IAutomataStateContainer<StateType> {
	validateContext: TValidator<TAutomataStateContext<StateType, ContextType>>;

	setContextValidator: (contextValidator?: TValidator<TAutomataStateContext<StateType, ContextType>>) => this;
}

/**
 * Interface for an Automata extended event container.
 * @template EventType - The type of the event.
 * @template EventMetaType - The type of the event metadata.
 */
export interface IAutomataExtendedEventContainer<
	EventType extends TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any },
> extends IAutomataEventContainer<EventType> {
	validateEventMeta: TValidator<TAutomataEventMetaType<EventType, EventMetaType>>;

	setEventMetaValidator: (eventMetaValidator?: TValidator<TAutomataEventMetaType<EventType, EventMetaType>>) => this;
}

/**
 * Interface for an Automata extended validator container.
 * @template StateType - The type of the state.
 * @template ActionType - The type of the action.
 * @template EventType - The type of the event.
 * @template ContextType - The type of the context.
 * @template PayloadType - The type of the payload.
 * @template EventMetaType - The type of the event metadata.
 */
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

/**
 * Interface for an Automata event adapter.
 * @template StateType - The type of the state.
 * @template ActionType - The type of the action.
 * @template EventType - The type of the event.
 * @template ContextType - The type of the context.
 * @template PayloadType - The type of the payload.
 * @template EventMetaType - The type of the event metadata.
 */
export interface IAutomataEventAdapter<
	StateType extends TAutomataBaseStateType,
	ActionType extends TAutomataBaseActionType,
	EventType extends TAutomataBaseEventType,
	ContextType extends { [K in StateType]: any } = Record<StateType, any>,
	PayloadType extends { [K in ActionType]: any } = Record<ActionType, any>,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
> extends IAutomataValidatorContainer<StateType, ActionType, EventType> {
	/**
	 * Adds an event listener for the specified event type.
	 * @param type - The type of the event.
	 * @param handler - The event handler function.
	 * @returns A cancel function to remove the event listener, or null if the event type is invalid.
	 */
	addEventListener: <T extends EventType>(
		type: T,
		handler: TAutomataEventHandler<T, ActionType, EventMetaType, PayloadType>,
	) => null | TSubscriptionCancelFunction;

	/**
	 * Adds an event emitter for the specified state type.
	 * @param on - The state type to listen for.
	 * @param emitter - The event emitter function.
	 * @returns A cancel function to remove the event emitter, or null if the state type is invalid.
	 */
	addEventEmitter: <T extends StateType>(
		on: T,
		emitter: TAutomataEventEmitter<EventType, T, EventMetaType, ContextType>,
	) => null | TSubscriptionCancelFunction;

	/**
	 * Handles the specified event and returns the results of the event handlers.
	 * @param event - The event to handle.
	 * @returns An array of the results of the event handlers.
	 */
	handleEvent: <T extends EventType>(
		event: TAutomataEventMetaType<T, EventMetaType>,
	) => Array<ReturnType<TAutomataEventHandler<T, ActionType, EventMetaType, PayloadType>>>;

	/**
	 * Handles the transition to the specified new state and returns the results of the event emitters.
	 * @param newState - The new state to transition to.
	 * @returns An array of the results of the event emitters.
	 */
	handleTransition: <T extends StateType>(
		newState: TAutomataStateContext<T, ContextType>,
	) => Array<ReturnType<TAutomataEventEmitter<EventType, T, EventMetaType, ContextType>>>;

	/**
	 * Removes all event listeners for the specified event type.
	 * @param type - The type of the event, or null to remove all event listeners.
	 * @returns The event adapter instance.
	 */
	removeAllListeners: <T extends EventType>(type: T | null) => this;

	/**
	 * Removes all event emitters for the specified state type.
	 * @param type - The type of the state, or null to remove all event emitters.
	 * @returns The event adapter instance.
	 */
	removeAllEmitters: <T extends StateType>(type: T | null) => this;

	/**
	 * Returns an array of the observed event types.
	 * @returns An array of the observed event types.
	 */
	getObservedEvents: () => EventType[];

	/**
	 * Returns an array of the observed state types.
	 * @returns An array of the observed state types.
	 */
	getObservedStates: () => StateType[];
}

/**
 * Interface for Automata, a state machine.
 * @template StateType - The type of the state.
 * @template ActionType - The type of the action.
 * @template EventType - The type of the event.
 * @template ContextType - The type of the context.
 * @template PayloadType - The type of the payload.
 * @template EventMetaType - The type of the event metadata.
 */
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
	init: (params: TAutomataParams<StateType, ActionType, EventType, ContextType, PayloadType, EventMetaType>) => this;

	/**
	 * Return current Reducer function
	 */
	getReducer: () => TAutomataReducer<StateType, ActionType, ContextType, PayloadType> | null;

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

	/**
	 * Pause the automata.
	 * @returns The updated automata instance.
	 */
	pause: () => this;
	/**
	 * Resuming will Collapse the Queue, unless the Instance is Disabled
	 */
	resume: () => this;

	/**
	 * Returns internal State and Context of the Instance
	 */
	getContext: <K extends StateType = StateType>() => TAutomataStateContext<K, ContextType>;

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
	 * Consume Action and return the new State and its context.
	 * The Queue is Collapsed beforehand, if not Disabled
	 * When Paused, puts an Action into the Queue instead
	 * When Disabled, doesn't change the internal State
	 * Returns the final result of all Actions, including the Queue
	 */
	dispatch: TAutomataDispatch<StateType, ActionType, ContextType, PayloadType>;
}

/**
 * Interface for a dictionary of states.
 * @template StateType - The type of state.
 * @template ContextType - The type of context.
 */
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
	getStateKeys: (states: TStateValuesCollection<StateType>) => Array<string | null>;

	/**
	 * Get all States for selected Keys, possibly scoped to namespace
	 * @param {keys:string[],namespace?:string} states
	 * @return {string[]}
	 */
	getStateValues: (states: TStateKeysCollection<StateType>) => Array<StateType | null>;
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
	removeStates: (params: TStateLookupParams<StateType>, removeContextTransformers?: boolean) => this;

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

/**
 * Interface for a dictionary of actions.
 * @template ActionType - The type of actions.
 * @template PayloadType - The type of payloads for each action.
 */
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
	getActionKeys: (actions: TActionValuesCollection<ActionType>) => Array<string | null>;

	/**
	 * Get all Actions for selected Keys, possibly scoped to namespace
	 * @param {keys:string[],namespace?:string} actions
	 * @return {Action[]}
	 */
	getActionValues: (actions: TActionKeysCollection<ActionType>) => Array<ActionType | null>;

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

export interface IEventDictionary<
	EventType extends TAutomataBaseEventType,
	PayloadType extends { [K in EventType]: any },
> extends IAutomataExtendedEventContainer<EventType, PayloadType> {
	/**
	 * Add new Events to the dictionary, possibly scope them to namespace
	 * @param {keys:string[],namespace?:string} actions
	 * @return {EventType[]} a list of Keys for newly added Events
	 */
	addEvents: (Events: TEventKeysCollection<EventType>) => EventType[];

	/**
	 * Get Keys of selected Events, possibly scoped to namespace
	 * @param {Events:EventType[],namespace?:string} Events
	 * @return {string[], null if not found}
	 */
	getEventKeys: (Events: TEventValuesCollection<EventType>) => Array<string | null>;

	/**
	 * Get all Events for selected Keys, possibly scoped to namespace
	 * @param {keys:string[],namespace?:string} Events
	 * @return {Event[]}
	 */
	getEventValues: (Events: TEventKeysCollection<EventType>) => Array<EventType | null>;

	/**
	 * remove Events from the Dictionary, possibly scoping them to namespace.
	 * @param {TEventLookupParams<EventType>} Search Events: Namespace and Events or Keys to remove
	 * @return {this}
	 */
	removeEvents: (Events: TEventLookupParams<EventType>) => this;

	/**
	 * remove all Events from the Dictionary, possibly scoping them to namespace.
	 * @param {string} namespace
	 * @return {this}
	 */
	clearEvents: (namespace?: string) => this;

	/**
	 * Get all mapped Event Types with their corresponding Keys, possibly filtered by Namespace
	 * @param {string} namespace
	 * @return {[string]:Event}
	 */
	getDictionary: (namespace?: string) => TEventDictionaryMapping<EventType>;
}

/**
 * Interface representing a slice of an automata.
 * @template EventType - The type of events.
 * @template EventMetaType - The type of event metadata.
 * @template ModelType - The type of the model.
 */
export interface IAutomataSlice<
	EventType extends TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
	ModelType extends object = Record<string, any>,
> extends IAutomataEventContainer<EventType> {
	/**
	 * A record of machines, where each machine is an instance of `IAutomata`.
	 */
	getMachines: Record<string, IAutomata<any, any, EventType>>;

	/**
	 * Adds a machine to the automata slice.
	 * @param machineId - The ID of the machine.
	 * @param automata - The instance of `IAutomata` to add.
	 * @returns The current instance of `IAutomataSlice`.
	 */
	addMachine: <
		StateType extends TAutomataBaseStateType,
		ActionType extends TAutomataBaseActionType,
		ContextType extends { [K in StateType]: any } = Record<StateType, any>,
		PayloadType extends { [K in ActionType]: any } = Record<ActionType, any>,
	>(
		machineId: string,
		automata: IAutomata<StateType, ActionType, EventType, ContextType, PayloadType, EventMetaType>,
	) => this;

	/**
	 * Removes a machine from the automata slice.
	 * @param machineId - The ID of the machine to remove.
	 * @returns The current instance of `IAutomataSlice`.
	 */
	removeMachine: (machineId: string) => this;

	/**
	 * A record of composite states, where each composite state is an instance of `TAutomataStateContext`.
	 */
	getCompositeState: Record<string, TAutomataStateContext<any, any>>;

	/**
	 * Restores a state for a specific machine.
	 * @param machineId - The ID of the machine.
	 * @param state - The state object to restore.
	 * @returns The current instance of `IAutomataSlice`.
	 */
	restoreState: <
		StateType extends TAutomataBaseStateType,
		ContextType extends { [K in StateType]: any } = Record<StateType, any>,
	>(
		machineId: string,
		state: TAutomataStateContext<StateType, ContextType>,
	) => this;

	/**
	 * Restores composite states for all machines.
	 * @param compositeState - The record of composite states to restore.
	 * @returns The current instance of `IAutomataSlice`.
	 */
	restoreCompositeState: (compositeState: Record<string, TAutomataStateContext<any, any>>) => this;

	/**
	 * Returns the event matrix, which is a record of events and their corresponding effects.
	 * @returns The event matrix.
	 */
	getEventMatrix: () => Record<EventType, Array<TAutomataEffect<ModelType, EventType>>>;

	/**
	 * Dispatches an event and triggers its effects.
	 * @param event - The event object to dispatch.
	 * @returns The current instance of `IAutomataSlice`.
	 */
	dispatchEvent: (event: TAutomataEventMetaType<EventType, EventMetaType>) => this;

	/**
	 * Starts the automata slice.
	 * @returns The current instance of `IAutomataSlice`.
	 */
	start: () => this;

	/**
	 * Stops the automata slice.
	 * @param clearStack - Indicates whether to clear the event stack.
	 * @returns The current instance of `IAutomataSlice`.
	 */
	stop: (clearStack: boolean) => this;

	/**
	 * Checks if the automata slice is running.
	 * @returns `true` if the automata slice is running, `false` otherwise.
	 */
	isRunning: () => boolean;

	/**
	 * Returns the event stack.
	 * @returns The event stack.
	 */
	getEventStack: () => TAutomataEventStack<EventType, EventMetaType>;

	/**
	 * Clears the event stack.
	 * @returns The current instance of `IAutomataSlice`.
	 */
	clearEventStack: () => this;

	/**
	 * Consumes the event stack and returns the events and their effects.
	 * @returns An object containing the events and their effects.
	 */
	consumeEvent: () => {
		events: TAutomataEventStack<EventType, EventMetaType>;
		effects: Array<TAutomataEffect<ModelType, EventType>>;
	};

	/**
	 * Returns the effects associated with a specific event.
	 * @param event - The event for which to retrieve the effects.
	 * @returns The effects associated with the event.
	 */
	getEventEffects: (event: EventType) => Array<TAutomataEffect<ModelType, EventType>>;
}

/**
 * Interface for an event bus that supports subscribing and dispatching events.
 * @template EventType The type of events that can be dispatched.
 * @template EventMetaType The type of metadata associated with each event.
 */
export interface IAutomataEventBus<
	EventType extends TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
> extends IAutomataExtendedEventContainer<EventType, EventMetaType> {
	/**
	 * Subscribe  n to an event.
	 * @param event The event to subscribe to.
	 * @param callback The callback function to call when the event is dispatched.
	 * @returns This event bus instance.
	 */
	subscribe: (event: EventType, callback: TEventBusHandler<EventType, EventMetaType>) => this;
	/**
	 * Unsubscribe  from an event.
	 * @param event The event to unsubscribe from.
	 * @param callback The callback function to unsubscribe.
	 * @returns This event bus instance.
	 */
	unsubscribe: (event: EventType, callback: null | TEventBusHandler<EventType, EventMetaType>) => this;

	/**
	 * Dispatch one or more events.
	 * @param events The events to dispatch.
	 * @returns This event bus instance.
	 */
	dispatch: (...events: TAutomataEventStack<EventType, EventMetaType>) => this;

	/**
	 * Get the current event stack.
	 * @returns The current event stack.
	 */
	getEventStack: () => TAutomataEventStack<EventType, EventMetaType>;

	/**
	 * Clear the event stack.
	 * @returns This event bus instance.
	 */
	clearEventStack: () => this;

	/**
	 * Pause the event bus.
	 * @returns This event bus instance.
	 */
	pause: () => this;

	/**
	 * Resume the event bus.
	 * @returns This event bus instance.
	 */
	resume: () => this;

	/**
	 * Check if the event bus is running.
	 * @returns True if the event bus is running, false otherwise.
	 */
	isRunning: () => boolean;

	/**
	 * Process the events in the event stack.
	 * @returns The processed event stack.
	 */
	processEvents: () => TAutomataEventStack<EventType, EventMetaType>;
}
