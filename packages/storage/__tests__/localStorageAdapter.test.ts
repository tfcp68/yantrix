import { TVersionedStorageEnvelope, VersionedStorageAdapter } from '@yantrix/automata';
import { describe, expect, it, vi } from 'vitest';
import { createLocalStorageAdapter, LocalStorageAdapter } from '../src';

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
		const storage = createLocalStorageAdapter<{ count: number }>({
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

	it('validates the decoded snapshot before encoding and writing in the same turn', async () => {
		const backend = new KeyValueStorageStub();
		const storage = new LocalStorageAdapter<number>({
			id: 'counter',
			storage: backend,
			serialize: value => `value=${value}`,
			deserialize: value => Number(value.slice('value='.length)),
		});
		const validate = vi.fn();
		const initial = storage.saveConditionally(0, validate);
		expect(validate).toHaveBeenCalledWith(null);
		expect(backend.getItem('counter')).toBe('value=0');
		const update = storage.saveConditionally(2, validate);
		expect(validate.mock.calls).toEqual([[null], [0]]);
		expect(backend.getItem('counter')).toBe('value=2');
		await Promise.all([initial, update]);
	});

	it('preserves the stored data when decoding, validation or encoding rejects a write', async () => {
		const backend = new KeyValueStorageStub();
		const decodeError = new Error('invalid snapshot');
		const validationError = new Error('incompatible schema');
		const encodeError = new Error('cannot encode');
		const storage = new LocalStorageAdapter<number>({
			id: 'counter',
			storage: backend,
			deserialize: (raw) => {
				if (raw === 'invalid') throw decodeError;
				return Number(raw);
			},
			serialize: () => { throw encodeError; },
		});
		const rejectCurrent = vi.fn(() => {
			throw validationError;
		});
		backend.setItem('counter', 'invalid');
		await expect(storage.saveConditionally(2, rejectCurrent)).rejects.toBe(decodeError);
		expect(rejectCurrent).not.toHaveBeenCalled();
		expect(backend.getItem('counter')).toBe('invalid');

		backend.setItem('counter', '1');
		await expect(storage.saveConditionally(2, rejectCurrent)).rejects.toBe(validationError);
		await expect(storage.saveConditionally(2, () => {})).rejects.toBe(encodeError);
		expect(backend.getItem('counter')).toBe('1');
	});

	it('rejects a stale versioned save scheduled alongside a schema upgrade', async () => {
		const backend = new KeyValueStorageStub();
		const props = { id: 'model', storage: backend };
		const v1 = new VersionedStorageAdapter<string>({
			storage: new LocalStorageAdapter<TVersionedStorageEnvelope>(props),
			version: 1,
		});
		const v2 = new VersionedStorageAdapter<string>({
			storage: new LocalStorageAdapter<TVersionedStorageEnvelope>(props),
			version: 2,
			migrations: { 1: data => data },
		});
		await v1.save('old');
		const upgrade = v2.save('new');
		const stale = v1.save('late');
		await expect(stale).rejects.toThrow('newer');
		await upgrade;
		expect(await v2.load()).toBe('new');
	});

	it('uses the injected backend when accessing browser storage is denied', async () => {
		const error = new Error('storage access denied');
		vi.stubGlobal('window', {
			get localStorage() { throw error; },
		});
		try {
			const adapter = new LocalStorageAdapter({ id: 'model', storage: new KeyValueStorageStub() });
			await adapter.save(1);
			expect(await adapter.load()).toBe(1);
			expect(() => new LocalStorageAdapter({ id: 'native' })).toThrow(error);
		} finally {
			vi.unstubAllGlobals();
		}
	});

	it('fails explicitly when no browser backend was provided or available', () => {
		expect(() => new LocalStorageAdapter({ id: 'missing' })).toThrow('unavailable');
	});
});
