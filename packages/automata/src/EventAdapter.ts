import { unifyObjectKey } from '@yantrix/utils';
import { AbstractBaseClass } from './mixins/BaseClass.js';
import ExtendedValidatorContainer from './mixins/ExtendedValidatorContainer.js';
import {
	TAbstractConstructor,
	TAutomataBaseActionType,
	TAutomataBaseEventType,
	TAutomataBaseStateType,
	TAutomataEventEmitter,
	TAutomataEventHandler,
	TAutomataEventMetaType,
	TAutomataStateContext,
	TDefinedValues,
} from './types/index.js';
import { IAutomataEventAdapter } from './types/interfaces.js';

export function createEventAdapter<
	StateType extends TAutomataBaseStateType = TAutomataBaseStateType,
	ActionType extends TAutomataBaseActionType = TAutomataBaseActionType,
	EventType extends TAutomataBaseEventType = TAutomataBaseEventType,
	ContextType extends { [K in StateType]: any } = Record<StateType, any>,
	PayloadType extends { [K in ActionType]: any } = Record<ActionType, any>,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
>() {
	return <BaseType extends TAbstractConstructor = TAbstractConstructor>(Base: BaseType) =>
		class AbstractAutomataEventAdapter extends ExtendedValidatorContainer<
			StateType,
			ActionType,
			EventType,
			ContextType,
			PayloadType,
			EventMetaType
		>()(Base) {
			#eventListeners: {
				[T in EventType]?: Array<TAutomataEventHandler<T, ActionType, EventMetaType, PayloadType>>;
			};

			#eventEmitters: {
				[T in StateType]?: Array<TAutomataEventEmitter<EventType, T, EventMetaType, ContextType>>;
			};

			public constructor() {
				super();
				this.#eventListeners = {};
				this.#eventEmitters = {};
			}

			public addEventEmitter<T extends StateType>(
				on: T,
				emitter: TAutomataEventEmitter<EventType, T, EventMetaType, ContextType>,
			): (() => void) | null {
				if (on === null || on === undefined || !(emitter instanceof Function) || !this.validateState(on))
					return null;
				this.#eventEmitters = Object.assign(this.#eventEmitters ?? {}, {
					[on]: (this.#eventEmitters[on] ?? []).concat(emitter),
				});
				return () => {
					if (this.#eventEmitters?.[on]) {
						const newEmitters = (this.#eventEmitters[on] || []).filter(v => v !== emitter);
						if (!newEmitters.length)
							delete this.#eventEmitters[on];
						else this.#eventEmitters[on] = newEmitters;
					}
				};
			}

			public addEventListener<T extends EventType>(
				type: T,
				handler: TAutomataEventHandler<T, ActionType, EventMetaType, PayloadType>,
			): (() => void) | null {
				if (type === null || type === undefined || !(handler instanceof Function) || !this.validateEvent(type))
					return null;
				this.#eventListeners = Object.assign(this.#eventListeners ?? {}, {
					[type]: [...(this.#eventListeners?.[type] ?? []), handler],
				});
				return () => {
					if (this.#eventListeners?.[type]) {
						const newHandlers = (this.#eventListeners[type] || []).filter(v => v !== handler);
						if (!newHandlers.length)
							delete this.#eventListeners[type];
						else this.#eventListeners[type] = newHandlers;
					}
				};
			}

			public handleEvent<T extends EventType>(
				event: TAutomataEventMetaType<T, EventMetaType>,
			): Array<ReturnType<TAutomataEventHandler<T, ActionType, EventMetaType, PayloadType>>> {
				if (!this.validateEventMeta(event))
					return [];
				return (this.#eventListeners?.[event.event] || [])
					.map(handler => handler(event))
					.filter(action => this.validateAction(action.action));
			}

			public handleTransition<T extends StateType>(
				newState: TAutomataStateContext<T, ContextType>,
			): Array<ReturnType<TAutomataEventEmitter<EventType, T, EventMetaType, ContextType>>> {
				if (!this.validateContext(newState))
					return [];
				return (this.#eventEmitters?.[newState.state] || [])
					.map(emitter => emitter(newState))
					.filter(event => this.validateEvent(event.event));
			}

			public removeAllListeners<T extends EventType>(type: T | null = null): this {
				switch (true) {
					case type === null:
						this.#eventListeners = {};
						break;
					default:
						if (this.validateEvent(type) && this.#eventListeners?.[type])
							delete this.#eventListeners[type];
				}
				return this;
			}

			public removeAllEmitters<T extends StateType>(type: T | null = null): this {
				switch (true) {
					case type === null:
						this.#eventEmitters = {};
						break;
					default:
						if (this.validateState(type) && this.#eventEmitters?.[type])
							delete this.#eventEmitters[type];
				}
				return this;
			}

			public getObservedEvents(): TDefinedValues<EventType>[] {
				return Object
					.keys(this.#eventListeners)
					.map(unifyObjectKey<EventType>)
					.filter(k => this.#eventListeners[k]?.length)
					.filter(this.validateEvent);
			}

			public getObservedStates(): TDefinedValues<StateType>[] {
				return Object
					.keys(this.#eventEmitters)
					.map(unifyObjectKey<StateType>)
					.filter(k => this.#eventEmitters[k]?.length)
					.filter(this.validateState);
			}
		};
}

export class AutomataEventAdapter
	extends createEventAdapter()(AbstractBaseClass)
	implements
		IAutomataEventAdapter<
			TAutomataBaseStateType,
			TAutomataBaseActionType,
			TAutomataBaseEventType,
			Record<TAutomataBaseStateType, any>,
			Record<TAutomataBaseActionType, any>,
			Record<TAutomataBaseEventType, any>
		> {
	public constructor() {
		super();
	}
}

export default AutomataEventAdapter;
