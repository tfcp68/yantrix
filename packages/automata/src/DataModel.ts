import { assertSerializableModel, deepFreezeModel } from './ModelValidation.js';
import { TModelListener, TReadonlyModel, TSubscriptionCancelFunction } from './types/index.js';
import { IDataModelStore } from './types/interfaces.js';

/** Optional diagnostics applied to every snapshot accepted by {@link ModelStore}. */
export type TModelStoreOptions = {
	/** Opt-in diagnostics intended for development and tests only. */
	development?: {
		/** Freeze every accepted snapshot recursively. */
		freeze?: boolean;
		/** Reject values outside Yantrix's strict JSON-safe `Data Model` subset. */
		validateSerializable?: boolean;
	};
};

function assertModel(model: unknown): asserts model is object {
	if (typeof model !== 'object' || model === null) {
		throw new TypeError('Data Model must be a non-null object');
	}
}

/**
 * In-memory store for the application-global `Data Model`.
 *
 * The store deliberately remains anemic: it owns a snapshot and subscriptions,
 * while all business changes are calculated by pure `Effects`. A commit is based
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

	/** Returns the current `Data Model` snapshot. */
	public get(): ModelType {
		return this.#model;
	}

	/**
	 * Re-committing the same reference is a no-op.
	 * `ModelStore.commit()` installs the new `Data Model` and calls every subscriber in registration order.
	 * If subscribers throw, `commit()` finishes notifying the others, then throws an `AggregateError`
	 * containing the original errors in that order.
	 */
	public commit(model: ModelType | TReadonlyModel<ModelType>): void {
		if (model === this.#model) return;

		const nextModel = this.#prepare(model);
		const previousModel = this.#model;
		this.#model = nextModel;

		const errors: unknown[] = [];
		// A stable snapshot prevents listeners added during notification from
		// observing a commit that started before they subscribed.
		for (const listener of [...this.#listeners]) {
			try {
				listener(nextModel, previousModel);
			} catch (error) {
				errors.push(error);
			}
		}
		if (errors.length > 0) throw new AggregateError(errors, 'Data Model subscribers failed');
	}

	/** Subscribes to committed `Data Model` changes. */
	public subscribe(listener: TModelListener<ModelType>): TSubscriptionCancelFunction {
		if (typeof listener !== 'function') {
			throw new TypeError('Data Model listener must be a function');
		}

		this.#listeners.add(listener);
		return () => {
			this.#listeners.delete(listener);
		};
	}

	#prepare(model: ModelType | TReadonlyModel<ModelType>): ModelType {
		assertModel(model);
		if (this.#options.development?.validateSerializable) assertSerializableModel(model);
		if (this.#options.development?.freeze) deepFreezeModel(model);
		return model as ModelType;
	}
}
