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
		const browser = globalThis as { window?: { localStorage?: IKeyValueStorage } };
		const backend = storage ?? browser.window?.localStorage;
		if (!backend) throw new Error('LocalStorage backend is unavailable');
		this.id = id;
		this.#key = key;
		this.#storage = backend;
		this.#serialize = serialize;
		this.#deserialize = deserialize;
	}

	public async load(): Promise<SnapshotType | null> {
		return this.#readSnapshot();
	}

	public async save(snapshot: SnapshotType): Promise<void> {
		this.#writeSnapshot(snapshot);
	}

	/**
	 * `LocalStorageAdapter` reads, checks, and writes the stored value synchronously.
	 * Web Storage provides no transaction across tabs.
	 */
	public async saveConditionally(
		snapshot: SnapshotType,
		validateCurrent: (current: SnapshotType | null) => void,
	): Promise<void> {
		validateCurrent(this.#readSnapshot());
		this.#writeSnapshot(snapshot);
	}

	public async clear(): Promise<void> {
		this.#storage.removeItem(this.#key);
	}

	#readSnapshot(): SnapshotType | null {
		const value = this.#storage.getItem(this.#key);
		return value === null ? null : this.#deserialize(value);
	}

	#writeSnapshot(snapshot: SnapshotType): void {
		this.#storage.setItem(this.#key, this.#serialize(snapshot));
	}
}
