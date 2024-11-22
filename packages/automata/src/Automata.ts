import { isPositiveInteger } from '@yantrix/utils';
import { AbstractBaseClass } from './mixins/BaseClass.js';
import BasicValidatorContainer from './mixins/BasicValidatorContainer.js';
import {
	TAbstractConstructor,
	TAutomataActionPayload,
	TAutomataBaseActionType,
	TAutomataBaseEventType,
	TAutomataBaseStateType,
	TAutomataParams,
	TAutomataQueue,
	TAutomataReducer,
	TAutomataStateContext,
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
	return <BaseType extends TAbstractConstructor = TAbstractConstructor>(Base: BaseType) =>
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
			#actionQueue: TAutomataQueue<ActionType, PayloadType> = [];
			#enabled = true;
			#paused = false;
			#rootReducer: TAutomataReducer<StateType, ActionType, ContextType, PayloadType> | null = null;
			#functionRegistry: IAutomataFunctionRegistry | null = null;

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

			clearActionQueue(): this {
				this.#actionQueue = [];
				return this;
			}

			collapseActionQueue(): {
				actions: TAutomataQueue<ActionType, PayloadType> | null;
				newState: TAutomataStateContext<StateType, ContextType>;
			} {
				const actions = (this.#actionQueue ?? []).slice();
				const newState = this.reduceQueue();
				if (this.isEnabled()) {
					this.setContext(newState);
					this.clearActionQueue();
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
				action: TAutomataActionPayload<ActionType, PayloadType>,
			): TAutomataStateContext<StateType, ContextType> {
				if (!this.validateAction(action?.action))
					throw new Error(`Invalid Action: ${JSON.stringify(action)}`);
				if (!this.#rootReducer) {
					throw new Error(
						`Root Reducer is not defined. Please init the Instance with a rootReducer. Dispatched Action: ${JSON.stringify(
							action,
						)}`,
					);
				}
				const reducedValue = this.#rootReducer({
					...action,
					...this.reduceQueue(),
				});
				if (!reducedValue || !this.validateState(reducedValue.state))
					throw new Error(`Invalid Reduced State: ${reducedValue}`);
				if (this.isPaused()) {
					this.#actionQueue = this.getActionQueue().concat(action);
				} else if (this.isEnabled()) {
					this.clearActionQueue();
					this.setContext(reducedValue);

					if (this.eventAdapter) {
						this.eventAdapter.handleTransition(this.getContext());
					}
				}
				return reducedValue;
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
				let currentResponse: ReturnType<
					IAutomata<
						StateType,
						ActionType,
						EventType,
						ContextType,
						PayloadType,
						EventMetaType
					>['consumeAction']
				> = {
					action: null,
					newState: this.getContext(),
				};
				const queue = this.getActionQueue().slice(0, count);
				while (queue.length) {
					currentResponse = this.reduceQueueItem(queue, currentResponse.newState);
				}
				if (this.isEnabled()) {
					this.setActionQueue(this.getActionQueue().slice(count)).setContext(currentResponse.newState);
				}
				return currentResponse;
			}

			reduceQueueItem(queue = this.getActionQueue(), newState = this.getContext()): {
				action: TAutomataActionPayload<ActionType, PayloadType> | null;
				newState: TAutomataStateContext<StateType, ContextType>;
			} {
				if (!this.#rootReducer)
					throw new Error(`Root Reducer is not defined. Please init the Instance with a rootReducer.`);
				const currentResponse: ReturnType<
					IAutomata<
						StateType,
						ActionType,
						EventType,
						ContextType,
						PayloadType,
						EventMetaType
					>['consumeAction']
				> = {
					action: null,
					newState: newState || this.getContext(),
				};
				if (!queue?.length)
					return currentResponse;
				const currentAction = queue.shift();
				if (!currentAction)
					return currentResponse;
				if (!this.validateAction(currentAction?.action))
					throw new Error(`Invalid Action: ${currentAction}`);
				currentResponse.newState = this.#rootReducer({
					...currentResponse.newState,
					...currentAction,
				});
				currentResponse.action = currentAction;
				return currentResponse;
			}

			reduceQueue: () => TAutomataStateContext<StateType, ContextType> = () => {
				let reducedValue = this.getContext();
				if (!this.#rootReducer)
					throw new Error(`Root Reducer is not defined. Please init the Instance with a rootReducer`);
				const queue = this.getActionQueue();
				while (queue?.length) reducedValue = this.reduceQueueItem(queue, reducedValue).newState;
				return reducedValue;
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
