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

/** Constructor configuration for one {@link AutomataSlice} composition unit. */
export type TAutomataSliceProps<
	ModelType extends object,
	EventType extends TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any },
> = {
	id: string;
	effectMatrix?: TEffectMatrix<ModelType, EventType, EventMetaType>;
	eventValidator?: TValidator<EventType>;
};

/** FSM contract accepted by an {@link AutomataSlice}. */
export type TSliceMachine<
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

	/** Validator applied to Events queued through {@link dispatchEvent}. */
	public get validateEvent(): TValidator<EventType> {
		return this.#eventValidator;
	}

	/** Replaces the Slice Event validator or restores the positive-integer default. */
	public setEventValidator(eventValidator?: TValidator<EventType>): this {
		if (eventValidator === undefined) {
			this.#eventValidator = isPositiveInteger as TValidator<EventType>;
			return this;
		}
		if (typeof eventValidator !== 'function') throw new TypeError('Slice Event validator must be a function');
		this.#eventValidator = eventValidator;
		return this;
	}

	/** Returns a snapshot of machines keyed by their Slice-local IDs. */
	public getMachines(): Readonly<Record<string, TSliceMachine<EventType, EventMetaType>>> {
		return Object.fromEntries(this.#machines);
	}

	/** Adds one FSM; a running Slice enables and resumes it immediately. */
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

	/** Removes one FSM and pauses it first when the Slice is running. */
	public removeMachine(machineId: string): this {
		const machine = this.#machines.get(machineId);
		if (machine && this.#running) machine.pause();
		this.#machines.delete(machineId);
		return this;
	}

	/** Captures every registered FSM state/context pair by machine ID. */
	public getCompositeState(): Record<string, TAutomataStateContext<any, any>> {
		return Object.fromEntries(
			[...this.#machines].map(([machineId, machine]) => [machineId, machine.getContext()]),
		);
	}

	/** Restores one registered FSM state/context pair. */
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

	/** Restores a complete state snapshot after validating all machine IDs. */
	public restoreCompositeState(compositeState: Record<string, TAutomataStateContext<any, any>>): this {
		for (const machineId of Object.keys(compositeState)) {
			if (!this.#machines.has(machineId)) throw new Error(`Machine with id "${machineId}" is not registered`);
		}
		for (const [machineId, state] of Object.entries(compositeState)) this.restoreState(machineId, state);
		return this;
	}

	/** Returns a copy of the Slice Effect Matrix. */
	public getEventMatrix(): TEffectMatrix<ModelType, EventType, EventMetaType> {
		const matrix: Record<number, ReadonlyArray<TAutomataEffect<ModelType, EventType, EventMetaType>>> = {};
		for (const [event, effects] of this.#effectMatrix) matrix[event] = [...effects];
		return matrix as TEffectMatrix<ModelType, EventType, EventMetaType>;
	}

	/** Returns the ordered Effects declared for one Event. */
	public getEventEffects(event: EventType): Array<TAutomataEffect<ModelType, EventType, EventMetaType>> {
		return [...(this.#effectMatrix.get(event) ?? [])];
	}

	/** Queues an Event for consumption by a custom Slice driver. */
	public dispatchEvent(event: TAutomataEventMetaType<EventType, EventMetaType>): this {
		if (!this.validateEvent(event.event)) throw new TypeError('Invalid Event passed to Slice');
		this.#eventStack.push(event);
		return this;
	}

	/** Starts the Slice and enables/resumes all registered FSMs. Idempotent. */
	public start(): this {
		if (this.#running) return this;
		this.#running = true;
		for (const machine of this.#machines.values()) {
			machine.enable();
			machine.resume();
		}
		return this;
	}

	/** Stops the Slice, pauses its FSMs and optionally clears manually queued Events. */
	public stop(clearStack = false): this {
		if (this.#running) {
			this.#running = false;
			for (const machine of this.#machines.values()) machine.pause();
		}
		if (clearStack) this.clearEventStack();
		return this;
	}

	/** Reports whether the Slice lifecycle is running. */
	public isRunning(): boolean {
		return this.#running;
	}

	/** Returns a copy of Events queued for a custom/manual Slice driver. */
	public getEventStack(): TAutomataEventStack<EventType, EventMetaType> {
		return [...this.#eventStack];
	}

	/** Discards Events queued through {@link dispatchEvent}. */
	public clearEventStack(): this {
		this.#eventStack = [];
		return this;
	}

	/**
	 * Consumes the manual Event queue and resolves matching Slice Effects.
	 * A stopped Slice returns empty arrays. CoreLoop uses emitted FSM Events and
	 * the registered Effect Matrix directly instead of this manual-driver API.
	 */
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
