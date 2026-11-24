import { IStorageAdapter } from './types/interfaces.js';

// The adapter registers callbacks without reading their DOM-specific event arguments.
type TIndexedDBEventHandler = ((event: never) => void) | null;

interface IIndexedDBRequestLike<ResultType = unknown> {
	result?: ResultType;
	error?: unknown;
	onsuccess: TIndexedDBEventHandler;
	onerror: TIndexedDBEventHandler;
}

interface IIndexedDBObjectStoreLike {
	get: (key: string) => IIndexedDBRequestLike;
	put: (value: unknown, key: string) => IIndexedDBRequestLike;
	delete: (key: string) => IIndexedDBRequestLike;
}

interface IIndexedDBTransactionLike {
	error?: unknown;
	oncomplete: TIndexedDBEventHandler;
	onerror: TIndexedDBEventHandler;
	onabort: TIndexedDBEventHandler;
	objectStore: (name: string) => IIndexedDBObjectStoreLike;
}

interface IIndexedDBDatabaseLike {
	objectStoreNames: { contains: (name: string) => boolean };
	onversionchange?: TIndexedDBEventHandler;
	createObjectStore: (name: string) => unknown;
	transaction: (storeName: string, mode: 'readonly' | 'readwrite') => IIndexedDBTransactionLike;
	close: () => void;
}

interface IIndexedDBOpenRequestLike extends IIndexedDBRequestLike<IIndexedDBDatabaseLike> {
	result: IIndexedDBDatabaseLike;
	onupgradeneeded: TIndexedDBEventHandler;
}

export interface IIndexedDBFactoryLike {
	open: (name: string, version?: number) => IIndexedDBOpenRequestLike;
}

export type TIndexedDBStorageAdapterProps = {
	id: string;
	key?: string;
	databaseName?: string;
	storeName?: string;
	databaseVersion?: number;
	indexedDB?: IIndexedDBFactoryLike;
};

/** IndexedDB-backed Storage for structured-clone-compatible snapshots. */
export class IndexedDBStorageAdapter<SnapshotType = unknown> implements IStorageAdapter<SnapshotType> {
	public readonly id: string;
	readonly #key: string;
	readonly #databaseName: string;
	readonly #storeName: string;
	readonly #databaseVersion: number;
	readonly #indexedDB: IIndexedDBFactoryLike;
	#databasePromise: Promise<IIndexedDBDatabaseLike> | null = null;

	constructor({
		id,
		key = id,
		databaseName = 'yantrix',
		storeName = 'models',
		databaseVersion = 1,
		indexedDB,
	}: TIndexedDBStorageAdapterProps) {
		if (typeof id !== 'string' || id.length === 0) throw new Error('Storage must provide a non-empty string id');
		const defaultIndexedDB = (globalThis as { indexedDB?: IIndexedDBFactoryLike }).indexedDB;
		if (!indexedDB && !defaultIndexedDB) throw new Error('IndexedDB backend is unavailable');
		if (!Number.isInteger(databaseVersion) || databaseVersion < 1) {
			throw new TypeError('IndexedDB version must be a positive integer');
		}
		this.id = id;
		this.#key = key;
		this.#databaseName = databaseName;
		this.#storeName = storeName;
		this.#databaseVersion = databaseVersion;
		this.#indexedDB = indexedDB ?? defaultIndexedDB!;
	}

	public async load(): Promise<SnapshotType | null> {
		const result = await this.#transaction('readonly', store => store.get(this.#key));
		return result === undefined ? null : result as SnapshotType;
	}

	public async save(snapshot: SnapshotType): Promise<void> {
		await this.#transaction('readwrite', store => store.put(snapshot, this.#key));
	}

	public async clear(): Promise<void> {
		await this.#transaction('readwrite', store => store.delete(this.#key));
	}

	public async close(): Promise<void> {
		const opening = this.#databasePromise;
		this.#databasePromise = null;
		if (opening) (await opening).close();
	}

	#open(): Promise<IIndexedDBDatabaseLike> {
		if (this.#databasePromise) return this.#databasePromise;

		const databasePromise = new Promise<IIndexedDBDatabaseLike>((resolve, reject) => {
			const request = this.#indexedDB.open(this.#databaseName, this.#databaseVersion);
			request.onupgradeneeded = () => {
				if (!request.result.objectStoreNames.contains(this.#storeName)) {
					request.result.createObjectStore(this.#storeName);
				}
			};
			request.onsuccess = () => {
				const database = request.result;
				database.onversionchange = () => {
					if (this.#databasePromise === databasePromise) this.#databasePromise = null;
					database.close();
				};
				resolve(database);
			};
			request.onerror = () => reject(request.error ?? new Error(`Failed to open IndexedDB "${this.#databaseName}"`));
		}).catch((error) => {
			if (this.#databasePromise === databasePromise) this.#databasePromise = null;
			throw error;
		});
		this.#databasePromise = databasePromise;
		return databasePromise;
	}

	async #transaction(
		mode: 'readonly' | 'readwrite',
		operation: (store: IIndexedDBObjectStoreLike) => IIndexedDBRequestLike,
	): Promise<unknown> {
		const database = await this.#open();
		return new Promise((resolve, reject) => {
			const transaction = database.transaction(this.#storeName, mode);
			const request = operation(transaction.objectStore(this.#storeName));
			transaction.oncomplete = () => resolve(request.result);
			transaction.onerror = () => reject(transaction.error ?? request.error ?? new Error('IndexedDB transaction failed'));
			transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction was aborted'));
			request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
		});
	}
}
