import {
	IKeyValueStorage,
	InMemoryStorageAdapter,
	IStorageAdapter,
	LocalStorageAdapter,
	TVersionedStorageEnvelope,
	VersionedStorageAdapter,
} from '@yantrix/core';

import {
	migrateSnapshotV1,
	TGameSnapshot,
	TGameSnapshotV1,
} from '../domain/gameModel';

export type { TGameSnapshot } from '../domain/gameModel';

export const SAVEGAME_VERSION = 2;
export const SAVEGAME_KEY = 'yantrix:infinite-constellations';

export function createVersionedGameStorage(
	storage: IStorageAdapter<TVersionedStorageEnvelope>,
): IStorageAdapter<TGameSnapshot> {
	return new VersionedStorageAdapter<TGameSnapshot>({
		storage,
		version: SAVEGAME_VERSION,
		migrations: {
			1: snapshot => migrateSnapshotV1(snapshot as TGameSnapshotV1),
		},
	});
}

export function createBrowserGameStorage(
	backend?: IKeyValueStorage,
): { storage: IStorageAdapter<TGameSnapshot>; persistent: boolean } {
	try {
		const localStorage = new LocalStorageAdapter<TVersionedStorageEnvelope>({
			id: 'infinite-constellations-savegame',
			key: SAVEGAME_KEY,
			storage: backend,
		});
		return { storage: createVersionedGameStorage(localStorage), persistent: true };
	} catch {
		const memory = new InMemoryStorageAdapter<TVersionedStorageEnvelope>({
			id: 'infinite-constellations-memory',
		});
		return { storage: createVersionedGameStorage(memory), persistent: false };
	}
}
