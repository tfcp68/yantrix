import { hydrateModel } from '@yantrix/automata';
import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it, vi } from 'vitest';
import { createIndexedDBStorageAdapter, IndexedDBStorageAdapter, InMemoryStorageAdapter } from '../src';

function requestResult<Request extends {
	result: unknown;
	error?: unknown;
	onsuccess: ((event: never) => void) | null;
	onerror: ((event: never) => void) | null;
}>(request: Request): Promise<Request['result']> {
	return new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

describe('indexedDB Storage adapter', () => {
	it('creates its object store and persists one snapshot by key', async () => {
		const storage = createIndexedDBStorageAdapter<{ count: number }>({
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

	it('waits for a closing v1 connection to finish its put before hydrating v2', async () => {
		const indexedDB = new IDBFactory();
		const writer = indexedDB.open('yantrix', 1);
		writer.onupgradeneeded = () => writer.result.createObjectStore('models');
		await requestResult(writer);
		// fake-indexeddb omits close-pending connections from its blocked check.
		// A second connection keeps the request blocked until the writer commits.
		const peer = indexedDB.open('yantrix', 1);
		await requestResult(peer);
		let blocked = false;
		let committed = false;
		writer.result.onversionchange = () => {
			const transaction = writer.result.transaction('models', 'readwrite');
			const models = transaction.objectStore('models');
			const put = () => {
				models.put(7, 'counter').onsuccess = () => {
					if (!blocked) put();
				};
			};
			put();
			writer.result.close();
			transaction.oncomplete = () => {
				committed = true;
				peer.result.close();
			};
		};
		const storage = new IndexedDBStorageAdapter<number>({
			id: 'counter',
			databaseVersion: 2,
			indexedDB: {
				open(name, version) {
					const request = indexedDB.open(name, version);
					request.addEventListener('blocked', () => {
						blocked = true;
					});
					return request;
				},
			},
		});
		try {
			const result = await hydrateModel({ count: 0 }, [{
				storage,
				select: model => model.count,
				hydrate: (_model, count: number) => ({ count }),
			}]);
			expect(blocked).toBe(true);
			expect(committed).toBe(true);
			expect(result.failures).toEqual([]);
			expect(result.model.count).toBe(7);
		} finally {
			blocked = true;
			writer.result.close();
			peer.result.close();
			await storage.close();
		}
	});

	it('times out blocked and queued opens without upgrading the database after timeout', async () => {
		const indexedDB = new IDBFactory();
		const older = indexedDB.open('yantrix', 1);
		await requestResult(older);
		const blocked = Promise.withResolvers<void>();
		const storage = new IndexedDBStorageAdapter<number>({
			id: 'indexed',
			databaseVersion: 2,
			openTimeoutMs: 100,
			indexedDB: {
				open(name, version) {
					const request = indexedDB.open(name, version);
					request.addEventListener('blocked', () => blocked.resolve());
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
			const hydration = hydrateModel({ count: 0 }, bindings, { onError });
			await blocked.promise;
			expect(onError).not.toHaveBeenCalled();
			await vi.advanceTimersByTimeAsync(100);
			const result = await hydration;
			expect(result.model).toEqual({ count: 7 });
			expect(result.loadedStorageIds).toEqual(['healthy']);
			expect(result.failures).toEqual([{ storageId: 'indexed', phase: 'load', error: expect.any(Error) }]);
			expect(onError).toHaveBeenCalledWith(result.failures[0]);
			expect(result.failures[0]?.error).toHaveProperty('message', expect.stringContaining('timed out'));

			const retry = expect(storage.load()).rejects.toThrow('timed out');
			await vi.advanceTimersByTimeAsync(100);
			await retry;
			older.result.close();
			const original = indexedDB.open('yantrix', 1);
			await requestResult(original);
			expect(original.result.objectStoreNames.length).toBe(0);
			original.result.close();
			await storage.save(9);
			expect(await storage.load()).toBe(9);
		} finally {
			older.result.close();
			await storage.close();
			vi.useRealTimers();
		}
	});

	it('provisions stores at a shared schema version and preserves snapshots across concurrent opens and reloads', async () => {
		const indexedDB = new IDBFactory();
		const props = { databaseName: 'shared', key: 'snapshot', databaseVersion: 1, indexedDB };
		const storage = (id: string) => new IndexedDBStorageAdapter<number>({ id, storeName: id, ...props });
		const names = ['cart', 'preferences', 'cursor'];
		const initial = names.map(storage);
		try {
			await Promise.all(initial.map((adapter, i) => adapter.save(i + 1)));
			expect(await Promise.all(initial.map(adapter => adapter.load()))).toEqual([1, 2, 3]);
		} finally {
			await Promise.all(initial.map(adapter => adapter.close()));
		}

		const fresh = names.map(storage);
		const newer = new IndexedDBStorageAdapter<number>({ ...props, id: 'cart', storeName: 'cart', databaseVersion: 2 });
		try {
			expect(await Promise.all(fresh.map(adapter => adapter.load()))).toEqual([1, 2, 3]);
			expect(await newer.load()).toBe(1);
			await expect(fresh[1]!.save(0)).rejects.toMatchObject({ name: 'VersionError' });
		} finally {
			await newer.close();
			await Promise.all(fresh.map(adapter => adapter.close()));
		}
	});

	it('leaves an existing application store and native version intact on a schema name collision', async () => {
		const indexedDB = new IDBFactory();
		const name = '\u0000yantrix/storage/schema';
		const create = indexedDB.open('yantrix', 1);
		create.onupgradeneeded = () => create.result.createObjectStore(name).put({ custom: true }, 'version');
		(await requestResult(create)).close();
		const adapter = new IndexedDBStorageAdapter({ id: 'counter', databaseVersion: 2, indexedDB });
		await expect(adapter.load()).rejects.toThrow('conflicts');
		const original = await requestResult(indexedDB.open('yantrix', 1));
		try {
			expect(Array.from(original.objectStoreNames)).toEqual([name]);
			const store = original.transaction(name).objectStore(name);
			expect(await requestResult(store.get('version'))).toEqual({ custom: true });
		} finally {
			original.close();
			await adapter.close();
		}
	});

	it('honors subsequent native schema upgrades to a database with multiple stores', async () => {
		const indexedDB = new IDBFactory();
		const first = new IndexedDBStorageAdapter({ id: 'first', storeName: 'first', indexedDB });
		const second = new IndexedDBStorageAdapter({ id: 'second', storeName: 'second', indexedDB });
		try {
			await first.save(1);
			await second.save(2);
			const nextVersion = await requestResult(indexedDB.open('yantrix', 4));
			nextVersion.close();
			await expect(first.save(0)).rejects.toMatchObject({ name: 'VersionError' });
			const latest = new IndexedDBStorageAdapter({ id: 'first', storeName: 'first', databaseVersion: 4, indexedDB });
			try {
				expect(await latest.load()).toBe(1);
			} finally {
				await latest.close();
			}
		} finally {
			await Promise.all([first.close(), second.close()]);
		}
	});

	it('bounds the schema probe when an existing writer holds the database', async () => {
		const indexedDB = new IDBFactory();
		const first = new IndexedDBStorageAdapter({ id: 'first', storeName: 'first', indexedDB, openTimeoutMs: 100 });
		const second = new IndexedDBStorageAdapter({ id: 'second', storeName: 'second', indexedDB });
		await first.save(1);
		await second.save(2);
		await Promise.all([first.close(), second.close()]);
		const holder = await requestResult(indexedDB.open('yantrix'));
		let keepReading = true;
		const transaction = holder.transaction(Array.from(holder.objectStoreNames), 'readwrite');
		const store = transaction.objectStore('first');
		const read = () => {
			store.get('first').onsuccess = () => {
				if (keepReading) read();
			};
		};
		read();
		try {
			await expect(first.load()).rejects.toThrow('timed out');
		} finally {
			keepReading = false;
			holder.close();
			await first.close();
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
