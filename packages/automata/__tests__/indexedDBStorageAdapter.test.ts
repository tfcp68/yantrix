import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it, vi } from 'vitest';
import { hydrateModel, IndexedDBStorageAdapter, InMemoryStorageAdapter } from '../src';

describe('indexedDB Storage adapter', () => {
	it('creates its object store and persists one snapshot by key', async () => {
		const storage = new IndexedDBStorageAdapter<{ count: number }>({
			id: 'indexed',
			databaseName: 'app',
			storeName: 'models',
			key: 'current',
			indexedDB: new IDBFactory(),
		});

		try {
			expect(await storage.load()).toBeNull();
			await storage.save({ count: 5 });
			expect(await storage.load()).toEqual({ count: 5 });
			await storage.clear();
			expect(await storage.load()).toBeNull();
		} finally {
			await storage.close();
		}
	});

	it('releases its connection on versionchange so another adapter can upgrade', async () => {
		const indexedDB = new IDBFactory();
		const first = new IndexedDBStorageAdapter({ id: 'counter', indexedDB });
		// Release a blocking connection even if the regression returns, so the assertion can report it.
		const onBlocked = vi.fn(() => first.close());
		const second = new IndexedDBStorageAdapter({
			id: 'counter',
			databaseVersion: 2,
			indexedDB: {
				open(name, version) {
					const request = indexedDB.open(name, version);
					request.addEventListener('blocked', onBlocked);
					return request;
				},
			},
		});

		try {
			await first.save({ count: 5 });
			expect(await second.load()).toEqual({ count: 5 });
			expect(onBlocked).not.toHaveBeenCalled();
			await expect(first.save({ count: 0 })).rejects.toMatchObject({ name: 'VersionError' });
			expect(await second.load()).toEqual({ count: 5 });
		} finally {
			await first.close();
			await second.close();
		}
	});

	it('reports a blocked open, bounds queued retries, and closes connections opened after either failure', async () => {
		const indexedDB = new IDBFactory();
		const older = indexedDB.open('yantrix', 1);
		await new Promise<void>((resolve, reject) => {
			older.onsuccess = () => resolve();
			older.onerror = () => reject(older.error);
		});
		const closed = vi.fn();
		const storage = new IndexedDBStorageAdapter<number>({
			id: 'indexed',
			databaseVersion: 2,
			openTimeoutMs: 100,
			indexedDB: {
				open(name, version) {
					const request = indexedDB.open(name, version);
					request.addEventListener('success', () => {
						const close = request.result.close.bind(request.result);
						request.result.close = () => {
							closed();
							close();
						};
					});
					return request;
				},
			},
		});
		const healthy = new InMemoryStorageAdapter({ id: 'healthy', initialSnapshot: 7 });
		const mapper = {
			select: (model: { count: number }) => model.count,
			hydrate: (_model: { count: number }, count: number) => ({ count }),
		};
		const onError = vi.fn();
		vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
		try {
			const bindings = [{ storage, ...mapper }, { storage: healthy, ...mapper }];
			const result = await hydrateModel({ count: 0 }, bindings, { onError });
			expect(result.model).toEqual({ count: 7 });
			expect(result.loadedStorageIds).toEqual(['healthy']);
			expect(result.failures).toEqual([{ storageId: 'indexed', phase: 'load', error: expect.any(Error) }]);
			expect(onError).toHaveBeenCalledWith(result.failures[0]);
			expect(result.failures[0]?.error).toHaveProperty('message', expect.stringContaining('blocked'));

			const retry = expect(storage.load()).rejects.toThrow('timed out');
			await vi.advanceTimersByTimeAsync(100);
			await retry;
			older.result.close();
			await storage.save(9);
			expect(closed).toHaveBeenCalledTimes(2);
			expect(await storage.load()).toBe(9);
		} finally {
			older.result.close();
			await storage.close();
			vi.useRealTimers();
		}
	});

	it('validates and writes atomically across independent connections to the same key', async () => {
		const props = { id: 'counter', indexedDB: new IDBFactory() };
		const first = new IndexedDBStorageAdapter<number>(props);
		const second = new IndexedDBStorageAdapter<number>(props);
		const conflict = new Error('already initialized');
		const requireEmpty = (current: number | null) => {
			if (current !== null) throw conflict;
		};
		try {
			await Promise.all([first.load(), second.load()]);
			const outcomes = await Promise.allSettled([
				first.saveConditionally(1, requireEmpty),
				second.saveConditionally(2, requireEmpty),
			]);
			expect(outcomes.filter(result => result.status === 'rejected')).toEqual([{ status: 'rejected', reason: conflict }]);
			expect(await first.load()).toBe(outcomes[0]?.status === 'fulfilled' ? 1 : 2);
		} finally {
			await Promise.all([first.close(), second.close()]);
		}
	});

	it('reopens when a new operation overlaps an explicit close', async () => {
		const storage = new IndexedDBStorageAdapter({ id: 'counter', indexedDB: new IDBFactory() });
		try {
			await storage.save(1);
			const closing = storage.close();
			expect(await storage.load()).toBe(1);
			await closing;
		} finally {
			await storage.close();
		}
	});

	it('fails explicitly when IndexedDB is unavailable', () => {
		expect(() => new IndexedDBStorageAdapter({ id: 'missing' })).toThrow('unavailable');
	});
});
