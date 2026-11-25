import { describe, expect, it, vi } from 'vitest';
import { InMemoryStorageAdapter, TVersionedStorageEnvelope, VersionedStorageAdapter } from '../src';

describe('versioned writes', () => {
	it('rejects an overlapping v1 save when the v2 write takes effect first', async () => {
		const raw = new InMemoryStorageAdapter<TVersionedStorageEnvelope>({
			id: 'shared',
			initialSnapshot: { version: 1, data: 'initial' },
		});
		const older = new VersionedStorageAdapter<string>({ storage: raw, version: 1 });
		const newer = new VersionedStorageAdapter<string>({
			storage: raw,
			version: 2,
			migrations: { 1: value => value },
		});
		expect(await older.load()).toBe('initial');

		const upgrade = newer.save('upgraded');
		const lateWrite = older.save('stale');
		await expect(lateWrite).rejects.toThrow('newer');
		await upgrade;
		expect(await raw.load()).toEqual({ version: 2, data: 'upgraded' });
	});

	it('migrates once on load and sends subsequent saves through the atomic operation alone', async () => {
		const raw = new InMemoryStorageAdapter<TVersionedStorageEnvelope>({
			id: 'counter',
			initialSnapshot: { version: 1, data: 4 },
		});
		const load = vi.spyOn(raw, 'load');
		const write = vi.spyOn(raw, 'saveConditionally');
		const migrate = vi.fn((value: unknown) => ({ count: value }));
		const storage = new VersionedStorageAdapter<{ count: number }>({
			storage: raw,
			version: 2,
			migrations: { 1: migrate },
		});

		expect(await storage.load()).toEqual({ count: 4 });
		await storage.save({ count: 5 });
		await storage.save({ count: 6 });

		expect(migrate).toHaveBeenCalledOnce();
		expect(load).toHaveBeenCalledOnce();
		expect(write).toHaveBeenCalledTimes(2);
		expect(await raw.load()).toEqual({ version: 2, data: { count: 6 } });
	});

	it('checks the raw schema without migrations when the connector only offers ordinary writes', async () => {
		const raw = new InMemoryStorageAdapter<TVersionedStorageEnvelope>({
			id: 'legacy',
			initialSnapshot: { version: 1, data: 4 },
		});
		const storage = {
			id: raw.id,
			load: vi.fn(() => raw.load()),
			save: vi.fn((value: TVersionedStorageEnvelope) => raw.save(value)),
			clear: () => raw.clear(),
		};
		const migrate = vi.fn((value: unknown) => ({ count: value }));
		const writer = new VersionedStorageAdapter({ storage, version: 2, migrations: { 1: migrate } });
		await writer.save({ count: 5 });
		expect(migrate).not.toHaveBeenCalled();
		expect(storage.load).toHaveBeenCalledOnce();
		expect(storage.save).toHaveBeenCalledOnce();

		const oldClient = new VersionedStorageAdapter({ storage, version: 1 });
		await expect(oldClient.save(0)).rejects.toThrow('newer');
		expect(storage.save).toHaveBeenCalledOnce();
		expect(await raw.load()).toEqual({ version: 2, data: { count: 5 } });
	});
});
