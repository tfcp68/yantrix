import {
	TAutomataBaseEventType,
	TAutomataEffect,
	TAutomataEventMetaType,
	TEffectFlushResult,
	TEffectMatrix,
	TSubscriptionCancelFunction,
} from './types/index.js';
import { IDataModelStore, IEffectScheduler } from './types/interfaces.js';

export type TEffectSchedulerProps<
	ModelType extends object,
	EventType extends TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any },
> = {
	store: IDataModelStore<ModelType>;
	matrices?: ReadonlyArray<TEffectMatrix<ModelType, EventType, EventMetaType>>;
};

type TNormalizedEffectMatrix<
	ModelType extends object,
	EventType extends TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any },
> = Map<EventType, ReadonlyArray<TAutomataEffect<ModelType, EventType, EventMetaType>>>;

function assertModel(model: unknown): asserts model is object {
	if (typeof model !== 'object' || model === null) {
		throw new TypeError('Effect must return a non-null Data Model object');
	}
}

/**
 * Transactional Effect Layer for the Yantrix Main Loop.
 *
 * Events are enqueued while FSM reducers run. `flush()` applies all matching
 * Effects in deterministic order and performs at most one Data Model commit.
 * The Main Loop owns the batch boundary and is expected to call `flush()` once
 * after it has finished processing its emitted Events.
 */
export class EffectScheduler<
	ModelType extends object,
	EventType extends TAutomataBaseEventType = TAutomataBaseEventType,
	EventMetaType extends { [K in EventType]: any } = Record<EventType, any>,
> implements IEffectScheduler<ModelType, EventType, EventMetaType> {
	readonly #store: IDataModelStore<ModelType>;
	readonly #matrices = new Map<symbol, TNormalizedEffectMatrix<ModelType, EventType, EventMetaType>>();
	#pendingEvents: Array<TAutomataEventMetaType<EventType, EventMetaType>> = [];
	#isFlushing = false;

	constructor({ store, matrices = [] }: TEffectSchedulerProps<ModelType, EventType, EventMetaType>) {
		this.#store = store;
		for (const matrix of matrices) this.addMatrix(matrix);
	}

	/** Number of Events waiting for the next Main Loop batch boundary. */
	public get pendingCount(): number {
		return this.#pendingEvents.length;
	}

	/**
	 * Registers a Slice Effect Matrix. Matrices and their Effects are evaluated
	 * in registration and declaration order.
	 */
	public addMatrix(
		matrix: TEffectMatrix<ModelType, EventType, EventMetaType>,
	): TSubscriptionCancelFunction {
		const normalized = new Map<EventType, ReadonlyArray<TAutomataEffect<ModelType, EventType, EventMetaType>>>();

		for (const [eventKey, eventEffects] of Object.entries(matrix)) {
			if (!eventEffects) continue;
			if (!Array.isArray(eventEffects)) {
				throw new TypeError(`Effects for Event ${eventKey} must be an array`);
			}

			const effects = eventEffects as Array<TAutomataEffect<ModelType, EventType, EventMetaType>>;
			if (effects.some(effect => typeof effect !== 'function')) {
				throw new TypeError(`Every Effect for Event ${eventKey} must be a function`);
			}

			normalized.set(Number(eventKey) as EventType, [...effects]);
		}

		const registration = Symbol('effect-matrix');
		this.#matrices.set(registration, normalized);

		return () => {
			this.#matrices.delete(registration);
		};
	}

	/** Adds an emitted Event to the current Main Loop batch. */
	public enqueue(event: TAutomataEventMetaType<EventType, EventMetaType>): this {
		if (typeof event !== 'object' || event === null || typeof event.event !== 'number') {
			throw new TypeError('Effect Scheduler requires a concrete Event');
		}

		this.#pendingEvents.push(event);
		return this;
	}

	/**
	 * Applies the current batch atomically and commits no more than one snapshot.
	 * A failed Effect consumes its batch but leaves the store unchanged.
	 */
	public flush(): TEffectFlushResult<ModelType> {
		if (this.#isFlushing) {
			throw new Error('Effect Scheduler cannot flush recursively');
		}

		const batch = this.#pendingEvents;
		this.#pendingEvents = [];
		const matrices = [...this.#matrices.values()];
		const previousModel = this.#store.get();
		let model = previousModel;
		let appliedEffects = 0;
		this.#isFlushing = true;

		try {
			for (const event of batch) {
				for (const matrix of matrices) {
					const effects = matrix.get(event.event as EventType) ?? [];
					for (const effect of effects) {
						const nextModel = effect(event, model);
						assertModel(nextModel);
						model = nextModel as ModelType;
						appliedEffects++;
					}
				}
			}

			this.#store.commit(model);
		} finally {
			this.#isFlushing = false;
		}

		return {
			model: this.#store.get(),
			previousModel,
			processedEvents: batch.length,
			appliedEffects,
			changed: model !== previousModel,
		};
	}

	/** Discards the current, not-yet-flushed batch. */
	public clear(): this {
		this.#pendingEvents = [];
		return this;
	}
}
