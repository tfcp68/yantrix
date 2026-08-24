import { assertSerializableModel, deepFreezeModel } from './ModelValidation.js';
import { TModelListener, TSubscriptionCancelFunction } from './types/index.js';
import { IDataModelStore } from './types/interfaces.js';

/** Optional diagnostics applied to every snapshot accepted by {@link ModelStore}. */
export type TModelStoreOptions = {
	/** Opt-in diagnostics intended for development and tests only. */
	development?: {
		/** Freeze every accepted snapshot recursively. */
		freeze?: boolean;
		/** Reject values outside Yantrix's strict JSON-safe Data Model subset. */
		validateSerializable?: boolean;
	};
};

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
	readonly #options: TModelStoreOptions;

	constructor(initialModel: ModelType, options: TModelStoreOptions = {}) {
		this.#options = options;
		this.#model = this.#prepare(initialModel);
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
		model = this.#prepare(model);
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

	#prepare(model: ModelType): ModelType {
		assertModel(model);
		if (this.#options.development?.validateSerializable) assertSerializableModel(model);
		if (this.#options.development?.freeze) deepFreezeModel(model);
		return model;
	}
}
