import { isPositiveInteger } from '@yantrix/utils';
import {
	TAutomataBaseEventType,
	TAutomataEffect,
	TAutomataEventMetaType,
	TAutomataEventStack,
	TAutomataStateContext,
	TEffectMatrix,
	TValidator,
} from './types/index.js';
import { IAutomata, IAutomataSlice } from './types/interfaces.js';

export type TAutomataSliceProps<
	ModelType extends object,
	EventType extends TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any },
> = {
	id: string;
	effectMatrix?: TEffectMatrix<ModelType, EventType, EventMetaType>;
	eventValidator?: TValidator<EventType>;
};

type TSliceMachine<
	EventType extends TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any },
> = IAutomata<any, any, EventType, any, any, EventMetaType>;

/** Independent unit of Yantrix business logic: FSMs plus an Effect Matrix. */
export class AutomataSlice<
	ModelType extends object,
	EventType extends TAutomataBaseEventType = TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
> implements IAutomataSlice<EventType, EventMetaType, ModelType> {
	public readonly id: string;
	readonly #machines = new Map<string, TSliceMachine<EventType, EventMetaType>>();
	readonly #effectMatrix = new Map<
		EventType,
		ReadonlyArray<TAutomataEffect<ModelType, EventType, EventMetaType>>
	>();

	#eventStack: TAutomataEventStack<EventType, EventMetaType> = [];
	#eventValidator: TValidator<EventType> = isPositiveInteger as TValidator<EventType>;
	#running = false;

	constructor({ id, effectMatrix = {}, eventValidator }: TAutomataSliceProps<ModelType, EventType, EventMetaType>) {
		if (!id) throw new Error('Slice must provide a non-empty string id');
		this.id = id;
		if (eventValidator) this.setEventValidator(eventValidator);

		for (const [eventKey, effects] of Object.entries(effectMatrix)) {
			if (!Array.isArray(effects)) throw new TypeError(`Effects for Event ${eventKey} must be an array`);
			if (effects.some(effect => typeof effect !== 'function')) {
				throw new TypeError(`Every Effect for Event ${eventKey} must be a function`);
			}
			this.#effectMatrix.set(
				Number(eventKey) as EventType,
				[...effects] as Array<TAutomataEffect<ModelType, EventType, EventMetaType>>,
			);
		}
	}

	public get validateEvent(): TValidator<EventType> {
		return this.#eventValidator;
	}

	public setEventValidator(eventValidator?: TValidator<EventType>): this {
		if (eventValidator === undefined) {
			this.#eventValidator = isPositiveInteger as TValidator<EventType>;
			return this;
		}
		if (typeof eventValidator !== 'function') throw new TypeError('Slice Event validator must be a function');
		this.#eventValidator = eventValidator;
		return this;
	}

	public getMachines(): Readonly<Record<string, TSliceMachine<EventType, EventMetaType>>> {
		return Object.fromEntries(this.#machines);
	}

	public addMachine<
		StateType extends number,
		ActionType extends number,
		ContextType extends { [K in StateType]: any } = Record<StateType, any>,
		PayloadType extends { [K in ActionType]: any } = Record<ActionType, any>,
	>(
		machineId: string,
		automata: IAutomata<StateType, ActionType, EventType, ContextType, PayloadType, EventMetaType>,
	): this {
		if (!machineId) throw new Error('Slice machine must provide a non-empty string id');
		if (this.#machines.has(machineId)) throw new Error(`Machine with id "${machineId}" already registered`);
		this.#machines.set(machineId, automata);
		if (this.#running) {
			automata.enable();
			automata.resume();
		}
		return this;
	}

	public removeMachine(machineId: string): this {
		const machine = this.#machines.get(machineId);
		if (machine && this.#running) machine.pause();
		this.#machines.delete(machineId);
		return this;
	}

	public getCompositeState(): Record<string, TAutomataStateContext<any, any>> {
		return Object.fromEntries(
			[...this.#machines].map(([machineId, machine]) => [machineId, machine.getContext()]),
		);
	}

	public restoreState<
		StateType extends number,
		ContextType extends { [K in StateType]: any } = Record<StateType, any>,
	>(
		machineId: string,
		state: TAutomataStateContext<StateType, ContextType>,
	): this {
		const machine = this.#machines.get(machineId);
		if (!machine) throw new Error(`Machine with id "${machineId}" is not registered`);
		machine.setContext(state);
		return this;
	}

	public restoreCompositeState(compositeState: Record<string, TAutomataStateContext<any, any>>): this {
		for (const machineId of Object.keys(compositeState)) {
			if (!this.#machines.has(machineId)) throw new Error(`Machine with id "${machineId}" is not registered`);
		}
		for (const [machineId, state] of Object.entries(compositeState)) this.restoreState(machineId, state);
		return this;
	}

	public getEventMatrix(): TEffectMatrix<ModelType, EventType, EventMetaType> {
		const matrix: Record<number, ReadonlyArray<TAutomataEffect<ModelType, EventType, EventMetaType>>> = {};
		for (const [event, effects] of this.#effectMatrix) matrix[event] = [...effects];
		return matrix as TEffectMatrix<ModelType, EventType, EventMetaType>;
	}

	public getEventEffects(event: EventType): Array<TAutomataEffect<ModelType, EventType, EventMetaType>> {
		return [...(this.#effectMatrix.get(event) ?? [])];
	}

	public dispatchEvent(event: TAutomataEventMetaType<EventType, EventMetaType>): this {
		if (!this.validateEvent(event.event)) throw new TypeError('Invalid Event passed to Slice');
		this.#eventStack.push(event);
		return this;
	}

	public start(): this {
		if (this.#running) return this;
		this.#running = true;
		for (const machine of this.#machines.values()) {
			machine.enable();
			machine.resume();
		}
		return this;
	}

	public stop(clearStack = false): this {
		if (this.#running) {
			this.#running = false;
			for (const machine of this.#machines.values()) machine.pause();
		}
		if (clearStack) this.clearEventStack();
		return this;
	}

	public isRunning(): boolean {
		return this.#running;
	}

	public getEventStack(): TAutomataEventStack<EventType, EventMetaType> {
		return [...this.#eventStack];
	}

	public clearEventStack(): this {
		this.#eventStack = [];
		return this;
	}

	public consumeEvent(): {
		events: TAutomataEventStack<EventType, EventMetaType>;
		effects: Array<TAutomataEffect<ModelType, EventType, EventMetaType>>;
	} {
		if (!this.#running) return { events: [], effects: [] };

		const events = this.#eventStack;
		this.#eventStack = [];
		return {
			events,
			effects: events.flatMap(event => this.getEventEffects(event.event as EventType)),
		};
	}
}
