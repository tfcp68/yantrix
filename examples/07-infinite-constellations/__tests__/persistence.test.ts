import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	InMemoryStorageAdapter,
	IStorageAdapter,
	TVersionedStorageEnvelope,
} from '@yantrix/core';
import { describe, expect, it, vi } from 'vitest';

import { createGameApplication } from '../src/runtime/createGameApplication';
import {
	createVersionedGameStorage,
	TGameSnapshot,
} from '../src/runtime/storage';

describe('infinite Constellations persistence', () => {
	it('hydrates and migrates a version 1 savegame before constructing the ModelStore', async () => {
		const fixturePath = path.join(
			path.dirname(fileURLToPath(import.meta.url)),
			'fixtures/savegame-v1.json',
		);
		const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8')) as TVersionedStorageEnvelope;
		const raw = new InMemoryStorageAdapter<TVersionedStorageEnvelope>({
			id: 'game',
			initialSnapshot: fixture,
		});
		const app = await createGameApplication({ storage: createVersionedGameStorage(raw) });

		expect(app.hydration.loadedStorageIds).toEqual(['game']);
		expect(app.store.get().board).toEqual({ '-2:5': 'umbra' });
		expect(app.store.get().nova).toEqual({ aurora: 0, umbra: 0 });
		await app.dispose();
	});

	it('coalesces rapid commits and restores the latest snapshot on reload', async () => {
		const backing = new InMemoryStorageAdapter<TVersionedStorageEnvelope>({ id: 'game' });
		const versioned = createVersionedGameStorage(backing);
		const save = vi.spyOn(versioned, 'save');
		const app = await createGameApplication({ storage: versioned, persistenceDebounceMs: 10 });

		app.commands.place(0, 0);
		await app.flushCommands();
		app.commands.place(1, 0);
		await app.flushCommands();
		await app.persistence.whenIdle();

		expect(save).toHaveBeenCalledOnce();
		await app.dispose();

		const reloaded = await createGameApplication({ storage: createVersionedGameStorage(backing) });
		expect(reloaded.store.get().board).toEqual({ '0:0': 'aurora', '1:0': 'umbra' });
		await reloaded.dispose();
	});

	it('reports hydration failures but keeps the game operational', async () => {
		const broken: IStorageAdapter<TGameSnapshot> = {
			id: 'broken',
			load: async () => { throw new Error('unavailable'); },
			save: async () => {},
			clear: async () => {},
		};
		const onStorageError = vi.fn();
		const app = await createGameApplication({ storage: broken, onStorageError });

		expect(app.hydration.failures).toHaveLength(1);
		expect(onStorageError).toHaveBeenCalledOnce();
		app.commands.place(2, 3);
		await app.flushCommands();
		expect(app.store.get().board['2:3']).toBe('aurora');
		await app.dispose();
	});

	it('reports save failures without rolling back a committed move', async () => {
		const failing: IStorageAdapter<TGameSnapshot> = {
			id: 'read-only',
			load: async () => null,
			save: async () => { throw new Error('quota exceeded'); },
			clear: async () => {},
		};
		const onStorageError = vi.fn();
		const app = await createGameApplication({
			storage: failing,
			persistenceDebounceMs: 0,
			onStorageError,
		});

		app.commands.place(8, -13);
		await app.flushCommands();
		await app.persistence.whenIdle();

		expect(app.store.get().board['8:-13']).toBe('aurora');
		expect(onStorageError).toHaveBeenCalledWith(expect.objectContaining({
			storageId: 'read-only',
			phase: 'save',
		}));
		await app.dispose();
	});
});
