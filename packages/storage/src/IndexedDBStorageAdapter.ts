import { createStorageAdapter } from '@yantrix/automata';

/** The adapter registers callbacks without reading their DOM-specific event arguments. */
export type TIndexedDBEventHandler = ((event: never) => void) | null;

/** @see {@link IIndexedDBFactoryLike} */
export interface IIndexedDBRequestLike<ResultType = unknown> {
	result?: ResultType;
	error?: unknown;
	onsuccess: TIndexedDBEventHandler;
	onerror: TIndexedDBEventHandler;
}

/** @see {@link IIndexedDBTransactionLike} */
export interface IIndexedDBObjectStoreLike {
	get: (key: string) => IIndexedDBRequestLike;
	put: (value: unknown, key: string) => IIndexedDBRequestLike;
	delete: (key: string) => IIndexedDBRequestLike;
}

/** @see {@link IIndexedDBDatabaseLike} */
export interface IIndexedDBTransactionLike {
	error?: unknown;
	abort: () => void;
	oncomplete: TIndexedDBEventHandler;
	onerror: TIndexedDBEventHandler;
	onabort: TIndexedDBEventHandler;
	objectStore: (name: string) => IIndexedDBObjectStoreLike;
}

/** @see {@link IIndexedDBOpenRequestLike} */
export interface IIndexedDBDatabaseLike {
	readonly version: number;
	objectStoreNames: { contains: (name: string) => boolean };
	onversionchange?: TIndexedDBEventHandler;
	createObjectStore: (name: string) => unknown;
	transaction: (storeName: string, mode: 'readonly' | 'readwrite') => IIndexedDBTransactionLike;
	close: () => void;
}

/** @see {@link IIndexedDBFactoryLike} */
export interface IIndexedDBOpenRequestLike extends IIndexedDBRequestLike<IIndexedDBDatabaseLike> {
	transaction: IIndexedDBTransactionLike | null;
	result: IIndexedDBDatabaseLike;
	onblocked: TIndexedDBEventHandler;
	onupgradeneeded: TIndexedDBEventHandler;
}

/** IndexedDB factory whose `open(name, version?)` method opens a named database at an optional physical version. */
export interface IIndexedDBFactoryLike {
	open: (name: string, version?: number) => IIndexedDBOpenRequestLike;
}

/** Connection and snapshot options for an IndexedDB-backed `Storage`. */
export type TIndexedDBStorageAdapterProps = {
	/** Identifies this `Storage` and supplies the default snapshot key. */
	id: string;
	/** Key for the snapshot in the object store. Defaults to `id`. */
	key?: string;
	/** IndexedDB database name. Defaults to `'yantrix'`. All adapters sharing this name use the same `databaseVersion`. */
	databaseName?: string;
	/** Object store for snapshots. Defaults to `'models'`. The store name `'\u0000yantrix/storage/schema'` is reserved. */
	storeName?: string;
	/**
	 * Use the same `databaseVersion` (default `1`) for all adapters sharing a `databaseName`.
	 * An adapter configured below the stored schema version gets `VersionError`.
	 * Adding a missing object store to an existing database raises its physical IndexedDB version,
	 * which can exceed `databaseVersion`. All other open connections to that database, including
	 * those in other tabs, must close before the upgrade can finish. Yantrix adapters close on
	 * `versionchange` and reopen on their next operation.
	 */
	databaseVersion?: number;
	/**
	 * `openTimeoutMs` defaults to 5000 ms and covers the entire open, including waiting for
	 * connections to close and provisioning the store.
	 */
	openTimeoutMs?: number;
	/** IndexedDB factory to use. Defaults to the environment's `indexedDB`. */
	indexedDB?: IIndexedDBFactoryLike;
};

// Only shared databases that need a physical upgrade to add a store get this record.
const schemaStore = '\u0000yantrix/storage/schema';
const schemaRecordKey = 'version';
const schemaFormat = 'yantrix/storage/schema/1';

function schemaRecord(configuredVersion: number, physicalVersion: number) {
	return { format: schemaFormat, configuredVersion, physicalVersion };
}

function abortPendingTransaction(transaction: IIndexedDBTransactionLike | null): void {
	try {
		transaction?.abort();
	} catch (error) {
		// Native I/O may already be committed while its completion event is queued.
		if ((error as Error)?.name !== 'InvalidStateError') throw error;
	}
}

async function configuredDatabaseVersion(database: IIndexedDBDatabaseLike, signal: AbortSignal): Promise<number> {
	if (!database.objectStoreNames.contains(schemaStore)) return database.version;
	const transaction = database.transaction(schemaStore, 'readonly');
	const request = transaction.objectStore(schemaStore).get(schemaRecordKey);
	const record = await new Promise<unknown>((resolve, reject) => {
		const onAbort = () => {
			reject(signal.reason);
			abortPendingTransaction(transaction);
		};
		signal.addEventListener('abort', onAbort, { once: true });
		transaction.oncomplete = () => {
			signal.removeEventListener('abort', onAbort);
			resolve(request.result);
		};
		transaction.onabort = () => {
			signal.removeEventListener('abort', onAbort);
			reject(transaction.error);
		};
	});
	return readConfiguredVersion(record, database.version);
}

function readConfiguredVersion(value: unknown, physicalVersion: number): number {
	const record = value as Partial<ReturnType<typeof schemaRecord>> | null | undefined;
	if (record?.format !== schemaFormat
		|| typeof record.configuredVersion !== 'number' || typeof record.physicalVersion !== 'number'
		|| !Number.isSafeInteger(record.configuredVersion) || !Number.isSafeInteger(record.physicalVersion)
		|| record.configuredVersion < 1 || record.physicalVersion < record.configuredVersion) {
		throw new Error('IndexedDB schema store conflicts with an existing object store');
	}
	// A native upgrade performed outside the adapter has its own schema version.
	return record.physicalVersion === physicalVersion ? record.configuredVersion : physicalVersion;
}

/** IndexedDB-backed `Storage` for structured-clone-compatible snapshots. */
export class IndexedDBStorageAdapter<SnapshotType = unknown> extends createStorageAdapter()<SnapshotType> {
	readonly #key: string;
	readonly #databaseName: string;
	readonly #storeName: string;
	readonly #databaseVersion: number;
	readonly #openTimeoutMs: number;
	readonly #indexedDB: IIndexedDBFactoryLike;
	#databasePromise: Promise<IIndexedDBDatabaseLike> | null = null;

	constructor({
		id,
		key = id,
		databaseName = 'yantrix',
		storeName = 'models',
		databaseVersion = 1,
		openTimeoutMs = 5000,
		indexedDB,
	}: TIndexedDBStorageAdapterProps) {
		super({ id });
		const defaultIndexedDB = (globalThis as { indexedDB?: IIndexedDBFactoryLike }).indexedDB;
		if (!indexedDB && !defaultIndexedDB) throw new Error('IndexedDB backend is unavailable');
		if (storeName === schemaStore) throw new Error('IndexedDB object store name is reserved for schema management');
		if (!Number.isSafeInteger(databaseVersion) || databaseVersion < 1) {
			throw new TypeError('IndexedDB version must be a positive integer');
		}
		if (!Number.isInteger(openTimeoutMs) || openTimeoutMs < 1 || openTimeoutMs > 2_147_483_647) {
			throw new TypeError('IndexedDB open timeout must be a positive 32-bit integer in milliseconds');
		}
		this.#key = key;
		this.#databaseName = databaseName;
		this.#storeName = storeName;
		this.#databaseVersion = databaseVersion;
		this.#openTimeoutMs = openTimeoutMs;
		this.#indexedDB = indexedDB ?? defaultIndexedDB!;
	}

	protected override async read(): Promise<SnapshotType | null> {
		const result = await this.#transaction('readonly', store => store.get(this.#key));
		return result === undefined ? null : result as SnapshotType;
	}

	protected override async write(snapshot: SnapshotType): Promise<void> {
		await this.#transaction('readwrite', store => store.put(snapshot, this.#key));
	}

	public async saveConditionally(
		snapshot: SnapshotType,
		validateCurrent: (current: SnapshotType | null) => void,
	): Promise<void> {
		await this.#transaction('readwrite', (store, abort) => {
			const read = store.get(this.#key);
			read.onsuccess = () => {
				try {
					validateCurrent(read.result === undefined ? null : read.result as SnapshotType);
					store.put(snapshot, this.#key);
				} catch (error) {
					abort(error);
				}
			};
			return read;
		});
	}

	protected override async remove(): Promise<void> {
		await this.#transaction('readwrite', store => store.delete(this.#key));
	}

	public async close(): Promise<void> {
		const opening = this.#databasePromise;
		this.#databasePromise = null;
		if (opening) await opening.then(database => database.close(), () => {});
	}

	#open(): Promise<IIndexedDBDatabaseLike> {
		if (this.#databasePromise) return this.#databasePromise;

		const controller = new AbortController();
		const timer = setTimeout(() => {
			controller.abort(new Error(`Opening IndexedDB "${this.#databaseName}" timed out`));
		}, this.#openTimeoutMs);
		const databasePromise = this.#openStore(controller.signal).then((database) => {
			clearTimeout(timer);
			database.onversionchange = () => {
				if (this.#databasePromise === databasePromise) this.#databasePromise = null;
				database.close();
			};
			return database;
		}, (error) => {
			clearTimeout(timer);
			if (this.#databasePromise === databasePromise) this.#databasePromise = null;
			throw error;
		});
		this.#databasePromise = databasePromise;
		return databasePromise;
	}

	async #openStore(signal: AbortSignal): Promise<IIndexedDBDatabaseLike> {
		let physicalVersion: number | undefined = this.#databaseVersion;
		for (;;) {
			signal.throwIfAborted();
			let database: IIndexedDBDatabaseLike;
			try {
				database = await this.#requestOpen(physicalVersion, signal);
			} catch (error) {
				// A peer may have advanced the physical version to provision another store.
				if (physicalVersion === undefined || (error as Error)?.name !== 'VersionError') throw error;
				physicalVersion = undefined;
				continue;
			}

			let closing = false;
			database.onversionchange = () => {
				closing = true;
				database.close();
			};
			try {
				const configuredVersion = await configuredDatabaseVersion(database, signal);
				signal.throwIfAborted();
				if (configuredVersion > this.#databaseVersion) {
					const error = new Error(`IndexedDB "${this.#databaseName}" uses schema version ${configuredVersion}`);
					error.name = 'VersionError';
					throw error;
				}
				if (closing) {
					physicalVersion = undefined;
				} else {
					const hasStore = database.objectStoreNames.contains(this.#storeName);
					if (hasStore && configuredVersion === this.#databaseVersion) return database;
					physicalVersion = Math.max(this.#databaseVersion, database.version + 1);
				}
			} catch (error) {
				database.close();
				throw error;
			}
			database.close();
		}
	}

	#requestOpen(version: number | undefined, signal: AbortSignal): Promise<IIndexedDBDatabaseLike> {
		return new Promise((resolve, reject) => {
			const request = this.#indexedDB.open(this.#databaseName, version);
			let upgradeError: unknown;
			const onAbort = () => {
				reject(signal.reason);
				abortPendingTransaction(request.transaction);
			};
			signal.addEventListener('abort', onAbort, { once: true });
			// A blocked request may still succeed after an older connection finishes its transaction.
			request.onupgradeneeded = () => {
				if (signal.aborted) {
					request.transaction!.abort();
					return;
				}
				const database = request.result;
				const transaction = request.transaction!;
				const provision = () => {
					if (!database.objectStoreNames.contains(this.#storeName)) {
						database.createObjectStore(this.#storeName);
					}
					if (database.version > this.#databaseVersion) {
						if (!database.objectStoreNames.contains(schemaStore)) database.createObjectStore(schemaStore);
						const schema = schemaRecord(this.#databaseVersion, database.version);
						transaction.objectStore(schemaStore).put(schema, schemaRecordKey);
					}
				};
				if (database.objectStoreNames.contains(schemaStore)) {
					const check = transaction.objectStore(schemaStore).get(schemaRecordKey);
					check.onsuccess = () => {
						try {
							readConfiguredVersion(check.result, database.version);
							provision();
						} catch (error) {
							upgradeError = error;
							transaction.abort();
						}
					};
				} else {
					provision();
				}
			};
			request.onsuccess = () => {
				signal.removeEventListener('abort', onAbort);
				if (signal.aborted) request.result.close();
				else resolve(request.result);
			};
			request.onerror = () => {
				signal.removeEventListener('abort', onAbort);
				reject(upgradeError ?? request.error ?? new Error(`Failed to open IndexedDB "${this.#databaseName}"`));
			};
		});
	}

	async #transaction(
		mode: 'readonly' | 'readwrite',
		operation: (store: IIndexedDBObjectStoreLike, abort: (error: unknown) => void) => IIndexedDBRequestLike,
	): Promise<unknown> {
		const database = await this.#open();
		return new Promise((resolve, reject) => {
			const transaction = database.transaction(this.#storeName, mode);
			const request = operation(transaction.objectStore(this.#storeName), (error) => {
				reject(error);
				transaction.abort();
			});
			transaction.oncomplete = () => resolve(request.result);
			transaction.onerror = () => reject(transaction.error ?? request.error ?? new Error('IndexedDB transaction failed'));
			transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction was aborted'));
			request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
		});
	}
}

/** @see {@link IndexedDBStorageAdapter} */
export function createIndexedDBStorageAdapter<SnapshotType = unknown>(
	props: TIndexedDBStorageAdapterProps,
): IndexedDBStorageAdapter<SnapshotType> {
	return new IndexedDBStorageAdapter<SnapshotType>(props);
}
