import { createStorageAdapter, TStorageAdapterProps } from '@yantrix/automata';

/** @see {@link InMemoryStorageAdapter} */
export type TInMemoryStorageAdapterProps<SnapshotType> = TStorageAdapterProps & {
	initialSnapshot?: SnapshotType | null;
	clone?: (snapshot: SnapshotType) => SnapshotType;
};

/** Reference `Storage` useful for tests, SSR and ephemeral application sessions. */
export class InMemoryStorageAdapter<SnapshotType = unknown> extends createStorageAdapter()<SnapshotType> {
	readonly #clone: (snapshot: SnapshotType) => SnapshotType;
	#snapshot: SnapshotType | null;

	constructor({
		id,
		initialSnapshot = null,
		clone = snapshot => snapshot,
	}: TInMemoryStorageAdapterProps<SnapshotType>) {
		super({ id });
		this.#clone = clone;
		this.#snapshot = initialSnapshot === null ? null : this.#clone(initialSnapshot);
	}

	protected override read(): SnapshotType | null {
		return this.#snapshot === null ? null : this.#clone(this.#snapshot);
	}

	protected override write(snapshot: SnapshotType): void {
		this.#snapshot = this.#clone(snapshot);
	}

	public async saveConditionally(
		snapshot: SnapshotType,
		validateCurrent: (current: SnapshotType | null) => void,
	): Promise<void> {
		validateCurrent(this.#snapshot === null ? null : this.#clone(this.#snapshot));
		this.#snapshot = this.#clone(snapshot);
	}

	protected override remove(): void {
		this.#snapshot = null;
	}
}

/** @see {@link InMemoryStorageAdapter} */
export function createInMemoryStorageAdapter<SnapshotType = unknown>(
	props: TInMemoryStorageAdapterProps<SnapshotType>,
): InMemoryStorageAdapter<SnapshotType> {
	return new InMemoryStorageAdapter<SnapshotType>(props);
}
