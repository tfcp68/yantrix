import { TSubscriptionCancelFunction } from './types/index.js';
import { IDataModelStore, IStorageAdapter } from './types/interfaces.js';

export type TStorageOperationPhase = 'load' | 'hydrate' | 'select' | 'save';

export type TStorageFailure = {
	storageId: string;
	phase: TStorageOperationPhase;
	error: unknown;
};

export type TStorageBinding<ModelType extends object, SnapshotType = unknown> = {
	storage: IStorageAdapter<SnapshotType>;
	select: (model: Readonly<ModelType>) => SnapshotType;
	hydrate: (model: Readonly<ModelType>, snapshot: SnapshotType) => ModelType;
};

type TAnyStorageBinding<ModelType extends object> = TStorageBinding<ModelType, any>;

export type TModelHydrationResult<ModelType extends object> = {
	model: ModelType;
	loadedStorageIds: string[];
	emptyStorageIds: string[];
	failures: TStorageFailure[];
};

function assertNonEmptyId(id: string): void {
	if (typeof id !== 'string' || id.length === 0) {
		throw new Error('Storage must provide a non-empty string id');
	}
}

function assertModel(model: unknown): asserts model is object {
	if (typeof model !== 'object' || model === null) {
		throw new TypeError('Storage hydration must return a non-null Data Model object');
	}
}

function assertUniqueBindings<ModelType extends object>(bindings: ReadonlyArray<TAnyStorageBinding<ModelType>>): void {
	const ids = new Set<string>();
	for (const { storage } of bindings) {
		assertNonEmptyId(storage.id);
		if (ids.has(storage.id)) throw new Error(`Duplicate Storage id "${storage.id}"`);
		ids.add(storage.id);
	}
}

/**
 * Polls every Storage concurrently, then composes successful snapshots in
 * registration order so hydration stays deterministic regardless of I/O timing.
 */
export async function hydrateModel<ModelType extends object>(
	initialModel: ModelType,
	bindings: ReadonlyArray<TAnyStorageBinding<ModelType>>,
): Promise<TModelHydrationResult<ModelType>> {
	assertModel(initialModel);
	assertUniqueBindings(bindings);

	const loads = await Promise.all(bindings.map(async (binding) => {
		try {
			return { ok: true as const, binding, snapshot: await binding.storage.load() };
		} catch (error) {
			return { ok: false as const, binding, error };
		}
	}));

	let model = initialModel;
	const loadedStorageIds: string[] = [];
	const emptyStorageIds: string[] = [];
	const failures: TStorageFailure[] = [];

	for (const load of loads) {
		const { binding } = load;
		if (!load.ok) {
			failures.push({ storageId: binding.storage.id, phase: 'load', error: load.error });
			continue;
		}
		const { snapshot } = load;
		if (snapshot === null) {
			emptyStorageIds.push(binding.storage.id);
			continue;
		}

		try {
			const hydratedModel = binding.hydrate(model, snapshot);
			assertModel(hydratedModel);
			model = hydratedModel as ModelType;
			loadedStorageIds.push(binding.storage.id);
		} catch (hydrationError) {
			failures.push({ storageId: binding.storage.id, phase: 'hydrate', error: hydrationError });
		}
	}

	return { model, loadedStorageIds, emptyStorageIds, failures };
}

export type TInMemoryStorageAdapterProps<SnapshotType> = {
	id: string;
	initialSnapshot?: SnapshotType | null;
	clone?: (snapshot: SnapshotType) => SnapshotType;
};

/** Reference Storage useful for tests, SSR and ephemeral application sessions. */
export class InMemoryStorageAdapter<SnapshotType = unknown> implements IStorageAdapter<SnapshotType> {
	public readonly id: string;
	readonly #clone: (snapshot: SnapshotType) => SnapshotType;
	#snapshot: SnapshotType | null;

	constructor({
		id,
		initialSnapshot = null,
		clone = snapshot => snapshot,
	}: TInMemoryStorageAdapterProps<SnapshotType>) {
		assertNonEmptyId(id);
		this.id = id;
		this.#clone = clone;
		this.#snapshot = initialSnapshot === null ? null : this.#clone(initialSnapshot);
	}

	public async load(): Promise<SnapshotType | null> {
		return this.#snapshot === null ? null : this.#clone(this.#snapshot);
	}

	public async save(snapshot: SnapshotType): Promise<void> {
		this.#snapshot = this.#clone(snapshot);
	}

	public async clear(): Promise<void> {
		this.#snapshot = null;
	}
}

export type TStorageSyncLoopProps<ModelType extends object> = {
	store: IDataModelStore<ModelType>;
	bindings?: ReadonlyArray<TAnyStorageBinding<ModelType>>;
	debounceMs?: number;
	onError?: (failure: TStorageFailure) => void;
};

/**
 * Independent asynchronous loop that projects committed Data Model snapshots to
 * Storages. Rapid commits are coalesced while an earlier write is in flight.
 */
export class StorageSyncLoop<ModelType extends object> {
	readonly #store: IDataModelStore<ModelType>;
	readonly #bindings = new Map<string, TAnyStorageBinding<ModelType>>();
	readonly #lastPersistedProjection = new Map<string, unknown>();
	readonly #failures: TStorageFailure[] = [];
	readonly #idleWaiters = new Set<() => void>();
	readonly #debounceMs: number;
	readonly #onError?: (failure: TStorageFailure) => void;

	#unsubscribe: TSubscriptionCancelFunction | null = null;
	#pendingModel: ModelType | null = null;
	#hasPendingModel = false;
	#drainScheduled = false;
	#drainTimer: ReturnType<typeof setTimeout> | null = null;
	#activeWrite: Promise<void> | null = null;
	#flushImmediately = false;

	constructor({ store, bindings = [], debounceMs = 0, onError }: TStorageSyncLoopProps<ModelType>) {
		if (!Number.isFinite(debounceMs) || debounceMs < 0) {
			throw new TypeError('Storage Sync Loop debounce must be a non-negative finite number');
		}
		this.#store = store;
		this.#debounceMs = debounceMs;
		this.#onError = onError;
		for (const binding of bindings) this.addStorage(binding);
	}

	public addStorage<SnapshotType>(binding: TStorageBinding<ModelType, SnapshotType>): TSubscriptionCancelFunction {
		assertNonEmptyId(binding.storage.id);
		if (this.#bindings.has(binding.storage.id)) {
			throw new Error(`Storage with id "${binding.storage.id}" is already registered`);
		}
		this.#bindings.set(binding.storage.id, binding as TAnyStorageBinding<ModelType>);

		return () => {
			if (this.#bindings.get(binding.storage.id) !== binding) return;
			this.#bindings.delete(binding.storage.id);
			this.#lastPersistedProjection.delete(binding.storage.id);
		};
	}

	public start(): this {
		if (this.#unsubscribe) return this;
		this.#unsubscribe = this.#store.subscribe(model => this.requestSync(model));
		return this;
	}

	public async stop(flushPending = true): Promise<void> {
		this.#unsubscribe?.();
		this.#unsubscribe = null;
		if (!flushPending) {
			this.#cancelScheduledDrain();
			this.#pendingModel = null;
			this.#hasPendingModel = false;
		} else {
			this.#flushImmediately = true;
			this.#cancelScheduledDrain();
			if (this.#hasPendingModel) this.#scheduleDrain();
		}
		await this.whenIdle();
		this.#flushImmediately = false;
	}

	public isRunning(): boolean {
		return this.#unsubscribe !== null;
	}

	/** Schedules a snapshot without waiting for external I/O. */
	public requestSync(model: ModelType = this.#store.get()): this {
		assertModel(model);
		this.#pendingModel = model;
		this.#hasPendingModel = true;
		this.#scheduleDrain();
		return this;
	}

	public getFailures(): ReadonlyArray<TStorageFailure> {
		return [...this.#failures];
	}

	public clearFailures(): this {
		this.#failures.length = 0;
		return this;
	}

	public whenIdle(): Promise<void> {
		if (!this.#hasPendingModel && !this.#drainScheduled && !this.#activeWrite) return Promise.resolve();
		return new Promise(resolve => this.#idleWaiters.add(resolve));
	}

	#scheduleDrain(): void {
		if (this.#activeWrite) return;
		if (this.#debounceMs > 0 && !this.#flushImmediately) {
			this.#cancelScheduledDrain();
			this.#drainScheduled = true;
			this.#drainTimer = setTimeout(() => {
				this.#drainTimer = null;
				this.#drain();
			}, this.#debounceMs);
			return;
		}
		if (this.#drainScheduled) return;
		this.#drainScheduled = true;
		queueMicrotask(() => this.#drain());
	}

	#cancelScheduledDrain(): void {
		if (this.#drainTimer) clearTimeout(this.#drainTimer);
		this.#drainTimer = null;
		this.#drainScheduled = false;
	}

	#drain(): void {
		this.#drainScheduled = false;
		if (this.#activeWrite || !this.#hasPendingModel || !this.#pendingModel) {
			this.#resolveIdleWaiters();
			return;
		}

		const model = this.#pendingModel;
		this.#pendingModel = null;
		this.#hasPendingModel = false;
		const bindings = [...this.#bindings.values()];
		this.#activeWrite = this.#persist(model, bindings).finally(() => {
			this.#activeWrite = null;
			if (this.#hasPendingModel) this.#scheduleDrain();
			else this.#resolveIdleWaiters();
		});
	}

	async #persist(model: ModelType, bindings: ReadonlyArray<TAnyStorageBinding<ModelType>>): Promise<void> {
		await Promise.all(bindings.map(async (binding) => {
			let projection: unknown;
			try {
				projection = binding.select(model);
			} catch (error) {
				this.#recordFailure({ storageId: binding.storage.id, phase: 'select', error });
				return;
			}

			if (this.#lastPersistedProjection.has(binding.storage.id)
				&& Object.is(this.#lastPersistedProjection.get(binding.storage.id), projection)) {
				return;
			}

			try {
				await binding.storage.save(projection);
				if (this.#bindings.get(binding.storage.id) === binding) {
					this.#lastPersistedProjection.set(binding.storage.id, projection);
				}
			} catch (error) {
				this.#recordFailure({ storageId: binding.storage.id, phase: 'save', error });
			}
		}));
	}

	#recordFailure(failure: TStorageFailure): void {
		this.#failures.push(failure);
		try {
			this.#onError?.(failure);
		} catch {
			// Error observers are representation-layer hooks and cannot compromise
			// persistence of other independent Storages.
		}
	}

	#resolveIdleWaiters(): void {
		if (this.#hasPendingModel || this.#drainScheduled || this.#activeWrite) return;
		const waiters = [...this.#idleWaiters];
		this.#idleWaiters.clear();
		for (const resolve of waiters) resolve();
	}
}

export type TVersionedStorageEnvelope = {
	version: number;
	data: unknown;
};

export type TVersionedStorageAdapterProps = {
	storage: IStorageAdapter<TVersionedStorageEnvelope>;
	version: number;
	migrations?: Readonly<Record<number, (snapshot: unknown) => unknown>>;
};

/** Adds schema versioning and ordered migrations to any Storage adapter. */
export class VersionedStorageAdapter<SnapshotType> implements IStorageAdapter<SnapshotType> {
	public readonly id: string;
	readonly #storage: IStorageAdapter<TVersionedStorageEnvelope>;
	readonly #version: number;
	readonly #migrations: Readonly<Record<number, (snapshot: unknown) => unknown>>;

	constructor({ storage, version, migrations = {} }: TVersionedStorageAdapterProps) {
		if (!Number.isInteger(version) || version < 1) throw new TypeError('Storage version must be a positive integer');
		this.id = storage.id;
		this.#storage = storage;
		this.#version = version;
		this.#migrations = migrations;
	}

	public async load(): Promise<SnapshotType | null> {
		const envelope = await this.#storage.load();
		if (envelope === null) return null;
		if (!Number.isInteger(envelope.version) || envelope.version < 1) {
			throw new TypeError(`Storage "${this.id}" contains an invalid version envelope`);
		}
		if (envelope.version > this.#version) {
			throw new Error(`Storage "${this.id}" snapshot is newer than supported version ${this.#version}`);
		}

		let version = envelope.version;
		let data = envelope.data;
		while (version < this.#version) {
			const migrate = this.#migrations[version];
			if (!migrate) throw new Error(`Storage "${this.id}" is missing migration from version ${version}`);
			data = migrate(data);
			version++;
		}
		return data as SnapshotType;
	}

	public async save(snapshot: SnapshotType): Promise<void> {
		await this.#storage.save({ version: this.#version, data: snapshot });
	}

	public async clear(): Promise<void> {
		await this.#storage.clear();
	}
}
