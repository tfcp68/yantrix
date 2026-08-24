import { describe, expect, it } from 'vitest';
import { IIndexedDBFactoryLike, IndexedDBStorageAdapter } from '../src';

type TRequest = {
	result?: unknown;
	error?: unknown;
	onsuccess: ((event?: unknown) => void) | null;
	onerror: ((event?: unknown) => void) | null;
};

class IndexedDBFactoryStub implements IIndexedDBFactoryLike {
	readonly values = new Map<string, unknown>();
	readonly stores = new Set<string>();

	open(_name: string, _version?: number) {
		const request: TRequest & {
			result: any;
			onupgradeneeded: ((event?: unknown) => void) | null;
		} = {
			result: null,
			onsuccess: null,
			onerror: null,
			onupgradeneeded: null,
		};
		const database = {
			objectStoreNames: { contains: (name: string) => this.stores.has(name) },
			createObjectStore: (name: string) => { this.stores.add(name); },
			close: () => {},
			transaction: (storeName: string) => {
				const transaction: any = {
					oncomplete: null,
					onerror: null,
					onabort: null,
					error: null,
					objectStore: () => ({
						get: (key: string) => this.operation(transaction, () => this.values.get(`${storeName}:${key}`)),
						put: (value: unknown, key: string) => this.operation(transaction, () => {
							this.values.set(`${storeName}:${key}`, value);
						}),
						delete: (key: string) => this.operation(transaction, () => {
							this.values.delete(`${storeName}:${key}`);
						}),
					}),
				};
				return transaction;
			},
		};
		request.result = database;
		queueMicrotask(() => {
			request.onupgradeneeded?.();
			request.onsuccess?.();
		});
		return request;
	}

	private operation(transaction: any, operation: () => unknown): TRequest {
		const request: TRequest = { onsuccess: null, onerror: null };
		queueMicrotask(() => {
			request.result = operation();
			request.onsuccess?.();
			transaction.oncomplete?.();
		});
		return request;
	}
}

describe('indexedDB Storage adapter', () => {
	it('creates its object store and persists one snapshot by key', async () => {
		const indexedDB = new IndexedDBFactoryStub();
		const storage = new IndexedDBStorageAdapter<{ count: number }>({
			id: 'indexed',
			databaseName: 'app',
			storeName: 'models',
			key: 'current',
			indexedDB,
		});

		expect(await storage.load()).toBeNull();
		await storage.save({ count: 5 });
		expect(await storage.load()).toEqual({ count: 5 });
		expect(indexedDB.stores.has('models')).toBe(true);
		await storage.clear();
		expect(await storage.load()).toBeNull();
	});

	it('fails explicitly when IndexedDB is unavailable', () => {
		expect(() => new IndexedDBStorageAdapter({ id: 'missing' })).toThrow('unavailable');
	});
});
