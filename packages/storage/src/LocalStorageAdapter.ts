import { createStorageAdapter, IKeyValueStorage, TLocalStorageAdapterProps } from '@yantrix/automata';

/**
 * Browser key-value persistence adapter with injectable serialization and backend.
 *
 * `saveConditionally()` reads, checks, and writes the stored value synchronously.
 * Web Storage provides no transaction across tabs.
 */
export class LocalStorageAdapter<SnapshotType = unknown> extends createStorageAdapter()<SnapshotType> {
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
		super({ id });
		const browser = globalThis as { window?: { localStorage?: IKeyValueStorage } };
		const backend = storage ?? browser.window?.localStorage;
		if (!backend) throw new Error('LocalStorage backend is unavailable');
		this.#key = key;
		this.#storage = backend;
		this.#serialize = serialize;
		this.#deserialize = deserialize;
	}

	protected override read(): SnapshotType | null {
		const value = this.#storage.getItem(this.#key);
		return value === null ? null : this.#deserialize(value);
	}

	protected override write(snapshot: SnapshotType): void {
		this.#storage.setItem(this.#key, this.#serialize(snapshot));
	}

	public async saveConditionally(
		snapshot: SnapshotType,
		validateCurrent: (current: SnapshotType | null) => void,
	): Promise<void> {
		validateCurrent(this.read());
		this.write(snapshot);
	}

	protected override remove(): void {
		this.#storage.removeItem(this.#key);
	}
}

/** @see {@link LocalStorageAdapter} */
export function createLocalStorageAdapter<SnapshotType = unknown>(
	props: TLocalStorageAdapterProps<SnapshotType>,
): LocalStorageAdapter<SnapshotType> {
	return new LocalStorageAdapter<SnapshotType>(props);
}
