import { TModelListener, TSubscriptionCancelFunction } from './types/index.js';
import { IDataModelStore } from './types/interfaces.js';

function assertModel(model: unknown): asserts model is object {
	if (typeof model !== 'object' || model === null) {
		throw new TypeError('Data Model must be a non-null object');
	}
}

/**
 * In-memory store for the application-global Data Model.
 *
 * The store deliberately remains anemic: it owns a snapshot and subscriptions,
 * while all business changes are calculated by pure Effects. A commit is based
 * on reference identity, matching Yantrix's immutable data flow.
 */
export class ModelStore<ModelType extends object> implements IDataModelStore<ModelType> {
	#model: ModelType;
	readonly #listeners = new Set<TModelListener<ModelType>>();

	constructor(initialModel: ModelType) {
		assertModel(initialModel);
		this.#model = initialModel;
	}

	/** Returns the current model snapshot. */
	public get(): ModelType {
		return this.#model;
	}

	/**
	 * Atomically replaces the snapshot and notifies subscribers once.
	 * Re-committing the same reference is a no-op.
	 */
	public commit(model: ModelType): void {
		assertModel(model);
		if (model === this.#model) return;

		const previousModel = this.#model;
		this.#model = model;

		// A stable snapshot prevents listeners added during notification from
		// observing a commit that started before they subscribed.
		for (const listener of [...this.#listeners]) {
			listener(model, previousModel);
		}
	}

	/** Subscribes to committed model changes. */
	public subscribe(listener: TModelListener<ModelType>): TSubscriptionCancelFunction {
		if (typeof listener !== 'function') {
			throw new TypeError('Data Model listener must be a function');
		}

		this.#listeners.add(listener);
		return () => {
			this.#listeners.delete(listener);
		};
	}
}
