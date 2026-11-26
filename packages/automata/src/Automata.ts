import { isPositiveInteger } from '@yantrix/utils';
import { AbstractBaseClass } from './mixins/BaseClass.js';
import BasicValidatorContainer from './mixins/BasicValidatorContainer.js';
import {
	TAutomataActionPayload,
	TAutomataBaseActionType,
	TAutomataBaseEventType,
	TAutomataBaseStateType,
	TAutomataEventStack,
	TAutomataParams,
	TAutomataQueue,
	TAutomataReducer,
	TAutomataStateContext,
	TBaseClassConstructor,
} from './types/index.js';

import { IAutomata, IAutomataEventAdapter, IAutomataFunctionRegistry } from './types/interfaces.js';

export function createAutomata<
	StateType extends TAutomataBaseStateType = TAutomataBaseStateType,
	ActionType extends TAutomataBaseActionType = TAutomataBaseActionType,
	EventType extends TAutomataBaseEventType = TAutomataBaseEventType,
	ContextType extends { [K in StateType]: any } = Record<StateType, any>,
	PayloadType extends { [K in ActionType]: any } = Record<ActionType, any>,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
>() {
	return <BaseType extends TBaseClassConstructor = TBaseClassConstructor>(Base: BaseType) =>
		class AbstractGenericAutomata extends BasicValidatorContainer<StateType, ActionType, EventType>()(Base) {
			public eventAdapter: IAutomataEventAdapter<
				StateType,
				ActionType,
				EventType,
				ContextType,
				PayloadType,
				EventMetaType
			> | null = null;

			#state: StateType | null = null;
			#context: ContextType[StateType] | null = null;
			#lastAction: ActionType | null = null;
			#actionQueue: TAutomataQueue<ActionType, PayloadType> = [];
			#enabled = true;
			#paused = false;
			#rootReducer: TAutomataReducer<StateType, ActionType, ContextType, PayloadType> | null = null;
			#functionRegistry: IAutomataFunctionRegistry | null = null;

			#currentCycle: number = 1;
			#eventListeners = new Set<(events: TAutomataEventStack<EventType, EventMetaType>) => void>();

			constructor(
				eventAdapter: IAutomataEventAdapter<
					StateType,
					ActionType,
					EventType,
					ContextType,
					PayloadType,
					EventMetaType
				> | null = null,
				...args: any[]
			) {
				super(args);
				if (eventAdapter)
					this.eventAdapter = eventAdapter;
			}

			get state(): StateType | null {
				return this.#state;
			}

			get context(): ContextType[StateType] | null {
				return this.#context;
			}

			get lastAction(): ActionType | null {
				return this.#lastAction;
			}

			set lastAction(action: ActionType | null) {
				this.#lastAction = action;
			}

			get currentCycle(): number {
				return this.#currentCycle;
			}

			incrementCycle(): this {
				this.#currentCycle++;
				return this;
			}

			clearActionQueue(): this {
				this.#actionQueue = [];
				return this;
			}

			collapseActionQueue(): {
				actions: TAutomataQueue<ActionType, PayloadType> | null;
				newState: TAutomataStateContext<StateType, ContextType>;
			} {
				const actions = (this.#actionQueue ?? []).slice();
				const transitions: TAutomataStateContext<StateType, ContextType>[] = [];
				const newState = this.#reduceActions(actions, transitions);
				if (this.isEnabled()) {
					this.setContext(newState);
					this.clearActionQueue();
					this.#emitTransitions(transitions);
				}
				return {
					actions,
					newState,
				};
			}

			enable(): this {
				this.#enabled = true;
				return this;
			}

			disable(clearQueue = false): this {
				this.#enabled = false;
				if (clearQueue)
					this.clearActionQueue();
				return this;
			}

			isEnabled(): boolean {
				return this.#enabled ?? true;
			}

			isPaused(): boolean {
				return this.#paused ?? false;
			}

			pause(): this {
				this.#paused = true;
				return this;
			}

			resume(): this {
				this.#paused = false;
				if (this.isEnabled())
					this.collapseActionQueue();
				return this;
			}

			init(params: TAutomataParams<StateType, ActionType, EventType, ContextType, PayloadType, EventMetaType>): this {
				const {
					state = null,
					context,
					paused = false,
					enabled = true,
					rootReducer = null,
					stateValidator,
					actionValidator,
					eventValidator,
					functionRegistry,
				} = params;
				if (rootReducer == null)
					this.#rootReducer = null;
				else if (rootReducer instanceof Function)
					this.#rootReducer = rootReducer;
				else throw new Error(`Invalid Root Reducer supplied: ${rootReducer}`);
				if (!this.validateState(state))
					throw new Error(`Invalid initial State: ${state}`);
				if (functionRegistry == null) {
					this.#functionRegistry = null;
				} else {
					this.#functionRegistry = functionRegistry;
				}
				this.#actionQueue = [];
				this.#enabled = enabled;
				this.#paused = paused;
				this.setContext({ state, context });
				if (stateValidator)
					this.setStateValidator(stateValidator);
				if (actionValidator)
					this.setActionValidator(actionValidator);
				if (eventValidator)
					this.setEventValidator(eventValidator);
				return this;
			}

			dispatch(
				actionWithPayload: TAutomataActionPayload<ActionType, PayloadType>,
			): TAutomataStateContext<StateType, ContextType> {
				this.#validateActionPayload(actionWithPayload);
				if (!this.#rootReducer) {
					throw new Error(
						`Root Reducer is not defined. Please init the Instance with a rootReducer. Dispatched Action: ${JSON.stringify(
							actionWithPayload,
						)}`,
					);
				}
				const transitions: TAutomataStateContext<StateType, ContextType>[] = [];
				const stateWithContext = this.#reduceActions(this.getActionQueue(), transitions);
				const reducedValue = this.#reduceAction(actionWithPayload, stateWithContext, transitions);
				if (this.isPaused()) {
					this.#actionQueue = this.getActionQueue().concat(actionWithPayload);
				} else if (this.isEnabled()) {
					this.clearActionQueue();
					this.setContext(reducedValue);
					this.incrementCycle();

					this.#emitTransitions(transitions);
				}
				return reducedValue;
			}

			onEmittedEvents(listener: (events: TAutomataEventStack<EventType, EventMetaType>) => void): () => void {
				this.#eventListeners.add(listener);
				return () => {
					this.#eventListeners.delete(listener);
				};
			}

			#emitTransitions(transitions: TAutomataStateContext<StateType, ContextType>[]): void {
				const adapter = this.eventAdapter;
				if (!adapter) return;
				const events = transitions.flatMap(state => adapter.handleTransition(state) ?? []);
				if (events.length) {
					for (const listener of this.#eventListeners) listener(events);
				}
			}

			getContext<K extends StateType = StateType>(): TAutomataStateContext<K, ContextType> {
				return {
					state: this.state as K,
					context: this.context,
				};
			}

			getActionQueue(): TAutomataActionPayload<ActionType, PayloadType>[] {
				return (this.#actionQueue ?? []).slice(0);
			}

			getReducer(): TAutomataReducer<StateType, ActionType, ContextType, PayloadType> | null {
				return this.#rootReducer;
			}

			consumeAction(count = 1): {
				action: TAutomataActionPayload<ActionType, PayloadType> | null;
				newState: TAutomataStateContext<StateType, ContextType>;
			} {
				if (!isPositiveInteger(count))
					throw new Error(`Invalid Action Count: ${count}`);
				const actions = this.getActionQueue().slice(0, count);
				const transitions: TAutomataStateContext<StateType, ContextType>[] = [];
				const newState = this.#reduceActions(actions, transitions);
				if (this.isEnabled()) {
					this.setActionQueue(this.getActionQueue().slice(count)).setContext(newState);
					this.#emitTransitions(transitions);
				}
				return { action: actions.at(-1) ?? null, newState };
			}

			#validateActionPayload(action: TAutomataActionPayload<ActionType, PayloadType>): void {
				if (!this.validateAction(action?.action))
					throw new Error(`Invalid Action: ${JSON.stringify(action)}`);
			}

			#reduceAction(
				action: TAutomataActionPayload<ActionType, PayloadType>,
				previous: TAutomataStateContext<StateType, ContextType>,
				transitions?: TAutomataStateContext<StateType, ContextType>[],
			): TAutomataStateContext<StateType, ContextType> {
				if (!this.#rootReducer)
					throw new Error('Root Reducer is not defined. Please init the Instance with a rootReducer.');
				const result = this.#rootReducer({ ...action, ...previous });
				if (!result || !this.validateState(result.state))
					throw new Error(`Invalid Reduced State: ${result}`);
				const next = { state: result.state, context: result.context };
				if (result.transitioned !== false) transitions?.push(next);
				return next;
			}

			#reduceActions(
				actions: TAutomataQueue<ActionType, PayloadType>,
				transitions?: TAutomataStateContext<StateType, ContextType>[],
			): TAutomataStateContext<StateType, ContextType> {
				if (!this.#rootReducer)
					throw new Error('Root Reducer is not defined. Please init the Instance with a rootReducer.');
				let state = this.getContext();
				for (const action of actions) {
					this.#validateActionPayload(action);
					state = this.#reduceAction(action, state, transitions);
				}
				return state;
			}

			reduceQueueItem(queue = this.getActionQueue(), newState = this.getContext()): {
				action: TAutomataActionPayload<ActionType, PayloadType> | null;
				newState: TAutomataStateContext<StateType, ContextType>;
			} {
				if (!this.#rootReducer)
					throw new Error('Root Reducer is not defined. Please init the Instance with a rootReducer.');
				const action = queue?.shift() ?? null;
				if (!action) return { action, newState };
				this.#validateActionPayload(action);
				return { action, newState: this.#reduceAction(action, newState) };
			}

			reduceQueue = (): TAutomataStateContext<StateType, ContextType> => {
				return this.#reduceActions(this.getActionQueue());
			};

			setContext: (context?: TAutomataStateContext<StateType, ContextType> | null) => this = (context = null) => {
				if (!context || !this.validateState(context?.state))
					throw new Error(`Invalid Context: ${context}`);
				this.#state = context.state;
				this.#context = context.context ?? null;
				return this;
			};

			setActionQueue: (queue?: TAutomataQueue<ActionType, PayloadType> | null) => this = (queue) => {
				if (!Array.isArray(queue))
					throw new Error(`Invalid Action Queue: ${queue}`);
				this.#actionQueue = queue;
				return this;
			};

			getFunctionRegistry(): IAutomataFunctionRegistry | null {
				return this.#functionRegistry;
			}

			setFunctionRegistry: (registry: IAutomataFunctionRegistry | null) => this = (registry = null) => {
				this.#functionRegistry = registry;
				return this;
			};

			getEventAdapter(): IAutomataEventAdapter<StateType, ActionType, EventType, ContextType, PayloadType, EventMetaType> | null {
				return this.eventAdapter;
			}

			setEventAdapter: (adapter: IAutomataEventAdapter<StateType, ActionType, EventType, ContextType, PayloadType, EventMetaType> | null) => this = (adapter = null) => {
				this.eventAdapter = adapter;
				return this;
			};
		};
}

/**
 * Class that represents a basic Yantrix Automata instance.
 */
export class GenericAutomata
	extends createAutomata<
		TAutomataBaseStateType,
		TAutomataBaseActionType,
		TAutomataBaseEventType,
		Record<TAutomataBaseStateType, any>,
		Record<TAutomataBaseActionType, any>,
		Record<TAutomataBaseEventType, any>
	>()(AbstractBaseClass)
	implements
		IAutomata<
			TAutomataBaseStateType,
			TAutomataBaseActionType,
			TAutomataBaseEventType,
			Record<TAutomataBaseStateType, any>,
			Record<TAutomataBaseActionType, any>,
			Record<TAutomataBaseEventType, any>
		> {}

export default GenericAutomata;
