import { InMemoryStorageAdapter, TVersionedStorageEnvelope } from '@yantrix/core';
import { describe, expect, it, vi } from 'vitest';

import { createGameApplication } from '../src/runtime/createGameApplication';
import { createVersionedGameStorage } from '../src/runtime/storage';

describe('infinite Constellations runtime vertical slice', () => {
	it('runs Source → generated FSM → emitted Effect → Model → Destination', async () => {
		const render = vi.fn();
		const storage = createVersionedGameStorage(
			new InMemoryStorageAdapter<TVersionedStorageEnvelope>({ id: 'game' }),
		);
		const app = await createGameApplication({ storage, render });
		const commits = vi.fn();
		app.store.subscribe(commits);

		app.commands.place(-40, 90);
		await app.flushCommands();

		expect(app.store.get().board['-40:90']).toBe('aurora');
		expect(commits).toHaveBeenCalledOnce();
		expect(render).toHaveBeenCalledOnce();
		expect(render).toHaveBeenLastCalledWith(app.store.get());
		await app.dispose();
	});

	it('commits multiple queued commands once per Effect batch', async () => {
		const storage = createVersionedGameStorage(
			new InMemoryStorageAdapter<TVersionedStorageEnvelope>({ id: 'game' }),
		);
		const app = await createGameApplication({ storage });
		const commits = vi.fn();
		app.store.subscribe(commits);

		app.commands.place(0, 0);
		app.commands.place(1, 0);
		await app.flushCommands();

		expect(app.store.get().board).toEqual({ '0:0': 'aurora', '1:0': 'umbra' });
		expect(commits).toHaveBeenCalledOnce();
		await app.dispose();
	});

	it('keeps invalid gameplay commands as end-to-end no-ops', async () => {
		const render = vi.fn();
		const app = await createGameApplication({
			storage: createVersionedGameStorage(
				new InMemoryStorageAdapter<TVersionedStorageEnvelope>({ id: 'game' }),
			),
			render,
		});
		app.commands.place(0, 0);
		await app.flushCommands();
		const placed = app.store.get();
		render.mockClear();

		app.commands.place(0, 0);
		await app.flushCommands();

		expect(app.store.get()).toBe(placed);
		expect(render).not.toHaveBeenCalled();
		await app.dispose();
	});

	it('runs the generated Nova and Reset Effects through the same Slice', async () => {
		const raw = new InMemoryStorageAdapter<TVersionedStorageEnvelope>({
			id: 'game',
			initialSnapshot: {
				version: 2,
				data: {
					board: { '0:0': 'aurora', '1:1': 'umbra' },
					currentPlayer: 'aurora',
					scores: { aurora: 1, umbra: 0 },
					nova: { aurora: 1, umbra: 0 },
					turn: 8,
				},
			},
		});
		const app = await createGameApplication({ storage: createVersionedGameStorage(raw) });

		app.commands.nova(1, 1);
		await app.flushCommands();
		expect(app.store.get().board).toEqual({ '0:0': 'aurora' });
		expect(app.store.get().nova.aurora).toBe(0);

		app.commands.reset();
		await app.flushCommands();
		expect(app.store.get()).toEqual(expect.objectContaining({
			board: {},
			scores: { aurora: 0, umbra: 0 },
			turn: 0,
		}));
		await app.dispose();
	});
});
