import { IStorageAdapter } from './types/interfaces.js';

interface IIndexedDBRequestLike<ResultType = unknown> {
	result?: ResultType;
	error?: unknown;
	onsuccess: ((event?: unknown) => void) | null;
	onerror: ((event?: unknown) => void) | null;
}

interface IIndexedDBObjectStoreLike {
	get: (key: string) => IIndexedDBRequestLike;
	put: (value: unknown, key: string) => IIndexedDBRequestLike;
	delete: (key: string) => IIndexedDBRequestLike;
}

interface IIndexedDBTransactionLike {
	error?: unknown;
	oncomplete: ((event?: unknown) => void) | null;
	onerror: ((event?: unknown) => void) | null;
	onabort: ((event?: unknown) => void) | null;
	objectStore: (name: string) => IIndexedDBObjectStoreLike;
}

interface IIndexedDBDatabaseLike {
	objectStoreNames: { contains: (name: string) => boolean };
	createObjectStore: (name: string) => unknown;
	transaction: (storeName: string, mode: 'readonly' | 'readwrite') => IIndexedDBTransactionLike;
	close: () => void;
}

interface IIndexedDBOpenRequestLike extends IIndexedDBRequestLike<IIndexedDBDatabaseLike> {
	result: IIndexedDBDatabaseLike;
	onupgradeneeded: ((event?: unknown) => void) | null;
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
		if (!this.#databasePromise) return;
		const database = await this.#databasePromise;
		database.close();
		this.#databasePromise = null;
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
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error ?? new Error(`Failed to open IndexedDB "${this.#databaseName}"`));
		}).catch((error) => {
			this.#databasePromise = null;
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
