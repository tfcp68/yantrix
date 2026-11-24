import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it, vi } from 'vitest';
import { IndexedDBStorageAdapter } from '../src';

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
					request.onblocked = onBlocked;
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
