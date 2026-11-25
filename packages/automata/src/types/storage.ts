export type TStorageAdapterProps = {
	id: string;
};

export type TInMemoryStorageAdapterProps<SnapshotType> = TStorageAdapterProps & {
	initialSnapshot?: SnapshotType | null;
	clone?: (snapshot: SnapshotType) => SnapshotType;
};

export interface IKeyValueStorage {
	getItem: (key: string) => string | null;
	setItem: (key: string, value: string) => void;
	removeItem: (key: string) => void;
}

export type TLocalStorageAdapterProps<SnapshotType> = TStorageAdapterProps & {
	key?: string;
	storage?: IKeyValueStorage;
	serialize?: (snapshot: SnapshotType) => string;
	deserialize?: (value: string) => SnapshotType;
};

// The adapter registers callbacks without reading their DOM-specific event arguments.
export type TIndexedDBEventHandler = ((event: never) => void) | null;

export interface IIndexedDBRequestLike<ResultType = unknown> {
	result?: ResultType;
	error?: unknown;
	onsuccess: TIndexedDBEventHandler;
	onerror: TIndexedDBEventHandler;
}

export interface IIndexedDBObjectStoreLike {
	get: (key: string) => IIndexedDBRequestLike;
	put: (value: unknown, key: string) => IIndexedDBRequestLike;
	delete: (key: string) => IIndexedDBRequestLike;
}

export interface IIndexedDBTransactionLike {
	error?: unknown;
	abort: () => void;
	oncomplete: TIndexedDBEventHandler;
	onerror: TIndexedDBEventHandler;
	onabort: TIndexedDBEventHandler;
	objectStore: (name: string) => IIndexedDBObjectStoreLike;
}

export interface IIndexedDBDatabaseLike {
	readonly version: number;
	objectStoreNames: { contains: (name: string) => boolean };
	onversionchange?: TIndexedDBEventHandler;
	createObjectStore: (name: string) => unknown;
	transaction: (storeName: string, mode: 'readonly' | 'readwrite') => IIndexedDBTransactionLike;
	close: () => void;
}

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
