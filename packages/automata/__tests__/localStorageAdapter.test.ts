import { describe, expect, it } from 'vitest';
import { LocalStorageAdapter } from '../src';

class KeyValueStorageStub {
	readonly values = new Map<string, string>();

	getItem(key: string): string | null {
		return this.values.get(key) ?? null;
	}

	setItem(key: string, value: string): void {
		this.values.set(key, value);
	}

	removeItem(key: string): void {
		this.values.delete(key);
	}
}

describe('localStorage adapter', () => {
	it('persists, loads and clears a JSON snapshot under its configured key', async () => {
		const backend = new KeyValueStorageStub();
		const storage = new LocalStorageAdapter<{ count: number }>({
			id: 'browser',
			key: 'yantrix:model',
			storage: backend,
		});

		expect(await storage.load()).toBeNull();
		await storage.save({ count: 2 });
		expect(backend.values.get('yantrix:model')).toBe('{"count":2}');
		expect(await storage.load()).toEqual({ count: 2 });
		await storage.clear();
		expect(await storage.load()).toBeNull();
	});

	it('supports custom serialization without coupling the core contract to JSON', async () => {
		const backend = new KeyValueStorageStub();
		const storage = new LocalStorageAdapter<number>({
			id: 'custom',
			storage: backend,
			serialize: value => String(value),
			deserialize: value => Number(value),
		});

		await storage.save(42);
		expect(await storage.load()).toBe(42);
	});

	it('fails explicitly when no browser backend was provided or available', () => {
		expect(() => new LocalStorageAdapter({ id: 'missing' })).toThrow('unavailable');
	});
});
