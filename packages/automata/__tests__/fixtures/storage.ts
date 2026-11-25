import { IStorageAdapter } from '../../src';

export function createTestStorage<SnapshotType>(
	{ id, initialSnapshot = null }: { id: string; initialSnapshot?: SnapshotType | null },
): IStorageAdapter<SnapshotType> {
	let current = initialSnapshot;
	return {
		id,
		load: async () => current,
		save: async (snapshot) => { current = snapshot; },
		clear: async () => { current = null; },
	};
}
