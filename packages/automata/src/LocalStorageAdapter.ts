import { IStorageAdapter } from './types/interfaces.js';

export interface IKeyValueStorage {
	getItem: (key: string) => string | null;
	setItem: (key: string, value: string) => void;
	removeItem: (key: string) => void;
}

export type TLocalStorageAdapterProps<SnapshotType> = {
	id: string;
	key?: string;
	storage?: IKeyValueStorage;
	serialize?: (snapshot: SnapshotType) => string;
	deserialize?: (value: string) => SnapshotType;
};

/** Browser key-value persistence adapter with injectable serialization and backend. */
export class LocalStorageAdapter<SnapshotType = unknown> implements IStorageAdapter<SnapshotType> {
	public readonly id: string;
	readonly #key: string;
	readonly #storage: IKeyValueStorage;
	readonly #serialize: (snapshot: SnapshotType) => string;
	readonly #deserialize: (value: string) => SnapshotType;

	constructor({
		id,
		key = id,
		storage,
		serialize = snapshot => JSON.stringify(snapshot),
		deserialize = value => JSON.parse(value) as SnapshotType,
	}: TLocalStorageAdapterProps<SnapshotType>) {
		if (typeof id !== 'string' || id.length === 0) throw new Error('Storage must provide a non-empty string id');
		const defaultStorage = (globalThis as { localStorage?: IKeyValueStorage }).localStorage;
		if (!storage && !defaultStorage) throw new Error('LocalStorage backend is unavailable');
		this.id = id;
		this.#key = key;
		this.#storage = storage ?? defaultStorage!;
		this.#serialize = serialize;
		this.#deserialize = deserialize;
	}

	public async load(): Promise<SnapshotType | null> {
		const value = this.#storage.getItem(this.#key);
		return value === null ? null : this.#deserialize(value);
	}

	public async save(snapshot: SnapshotType): Promise<void> {
		this.#storage.setItem(this.#key, this.#serialize(snapshot));
	}

	public async clear(): Promise<void> {
		this.#storage.removeItem(this.#key);
	}
}
