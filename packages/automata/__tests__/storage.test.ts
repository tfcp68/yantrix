import { describe, expect, it, vi } from 'vitest';
import {
	hydrateModel,
	InMemoryStorageAdapter,
	ModelStore,
	StorageSyncLoop,
	TStorageBinding,
	VersionedStorageAdapter,
} from '../src';

interface ITestModel {
	count: number;
	name: string;
}

type TCountSnapshot = { count: number };

function countBinding(
	storage: InMemoryStorageAdapter<TCountSnapshot>,
): TStorageBinding<ITestModel, TCountSnapshot> {
	return {
		storage,
		select: model => ({ count: model.count }),
		hydrate: (model, snapshot) => ({ ...model, count: snapshot.count }),
	};
}

describe('storage hydration', () => {
	it('loads Storages concurrently and composes snapshots in registration order', async () => {
		const firstLoad = Promise.withResolvers<TCountSnapshot>();
		const first = new InMemoryStorageAdapter<TCountSnapshot>({ id: 'first' });
		vi.spyOn(first, 'load').mockReturnValue(firstLoad.promise);
		const second = new InMemoryStorageAdapter<TCountSnapshot>({ id: 'second', initialSnapshot: { count: 2 } });
		const secondLoad = vi.spyOn(second, 'load');

		const hydration = hydrateModel<ITestModel>({ count: 0, name: 'initial' }, [
			countBinding(first),
			countBinding(second),
		]);
		await Promise.resolve();

		expect(secondLoad).toHaveBeenCalledOnce();
		firstLoad.resolve({ count: 1 });
		const result = await hydration;

		expect(result.model).toEqual({ count: 2, name: 'initial' });
		expect(result.loadedStorageIds).toEqual(['first', 'second']);
		expect(result.emptyStorageIds).toEqual([]);
		expect(result.failures).toEqual([]);
	});

	it('reports load and hydration failures while preserving successful snapshots', async () => {
		const broken = new InMemoryStorageAdapter<TCountSnapshot>({ id: 'broken' });
		// JavaScript permits rejecting with null; this must not be confused with
		// a successful load of an empty Storage.
		vi.spyOn(broken, 'load').mockRejectedValue(null);
		const invalid = new InMemoryStorageAdapter<TCountSnapshot>({
			id: 'invalid',
			initialSnapshot: { count: 4 },
		});
		const valid = new InMemoryStorageAdapter<TCountSnapshot>({
			id: 'valid',
			initialSnapshot: { count: 3 },
		});

		const result = await hydrateModel<ITestModel>({ count: 0, name: 'initial' }, [
			countBinding(broken),
			{ ...countBinding(invalid), hydrate: () => { throw new Error('invalid snapshot'); } },
			countBinding(valid),
		]);

		expect(result.model.count).toBe(3);
		expect(result.loadedStorageIds).toEqual(['valid']);
		expect(result.failures.map(failure => [failure.storageId, failure.phase])).toEqual([
			['broken', 'load'],
			['invalid', 'hydrate'],
		]);
	});

	it('rejects duplicate Storage identifiers before loading', async () => {
		const storage = new InMemoryStorageAdapter<TCountSnapshot>({ id: 'duplicate' });

		await expect(hydrateModel({ count: 0, name: 'initial' }, [
			countBinding(storage),
			countBinding(storage),
		])).rejects.toThrow('duplicate');
	});
});

describe('in-memory Storage', () => {
	it('loads, saves and clears snapshots through an optional clone boundary', async () => {
		const storage = new InMemoryStorageAdapter<TCountSnapshot>({
			id: 'memory',
			clone: snapshot => ({ ...snapshot }),
		});
		const snapshot = { count: 1 };

		await storage.save(snapshot);
		snapshot.count = 99;

		expect(await storage.load()).toEqual({ count: 1 });
		await storage.clear();
		expect(await storage.load()).toBeNull();
	});

	it('requires a non-empty identifier', () => {
		expect(() => new InMemoryStorageAdapter({ id: '' })).toThrow('non-empty');
	});
});

describe('storage Sync Loop', () => {
	it('coalesces commits queued before a write starts and does not block ModelStore', async () => {
		const store = new ModelStore<ITestModel>({ count: 0, name: 'initial' });
		const storage = new InMemoryStorageAdapter<TCountSnapshot>({ id: 'counter' });
		const save = vi.spyOn(storage, 'save');
		const loop = new StorageSyncLoop({ store, bindings: [countBinding(storage)] }).start();

		store.commit({ count: 1, name: 'one' });
		store.commit({ count: 2, name: 'two' });
		expect(save).not.toHaveBeenCalled();

		await loop.whenIdle();
		expect(save).toHaveBeenCalledOnce();
		expect(await storage.load()).toEqual({ count: 2 });
	});

	it('coalesces commits arriving during an in-flight write to the latest snapshot', async () => {
		const store = new ModelStore<ITestModel>({ count: 0, name: 'initial' });
		const storage = new InMemoryStorageAdapter<TCountSnapshot>({ id: 'counter' });
		const firstSave = Promise.withResolvers<void>();
		const saved: number[] = [];
		vi.spyOn(storage, 'save').mockImplementation(async (snapshot) => {
			saved.push(snapshot.count);
			if (snapshot.count === 1) await firstSave.promise;
		});
		const loop = new StorageSyncLoop({ store, bindings: [countBinding(storage)] }).start();

		store.commit({ count: 1, name: 'one' });
		await Promise.resolve();
		store.commit({ count: 2, name: 'two' });
		store.commit({ count: 3, name: 'three' });
		firstSave.resolve();
		await loop.whenIdle();

		expect(saved).toEqual([1, 3]);
	});

	it('skips a Storage when its selected projection is referentially unchanged', async () => {
		interface IProjectionModel { persistent: TCountSnapshot; transient: number }
		const persistent = { count: 1 };
		const store = new ModelStore<IProjectionModel>({ persistent, transient: 0 });
		const storage = new InMemoryStorageAdapter<TCountSnapshot>({ id: 'projection' });
		const save = vi.spyOn(storage, 'save');
		const loop = new StorageSyncLoop<IProjectionModel>({
			store,
			bindings: [{
				storage,
				select: model => model.persistent,
				hydrate: (model, snapshot) => ({ ...model, persistent: snapshot }),
			}],
		}).start();

		store.commit({ persistent, transient: 1 });
		await loop.whenIdle();
		store.commit({ persistent, transient: 2 });
		await loop.whenIdle();

		expect(save).toHaveBeenCalledOnce();
	});

	it('reports selector and save failures and continues syncing other Storages', async () => {
		const store = new ModelStore<ITestModel>({ count: 0, name: 'initial' });
		const selectorStorage = new InMemoryStorageAdapter<TCountSnapshot>({ id: 'selector' });
		const saveStorage = new InMemoryStorageAdapter<TCountSnapshot>({ id: 'save' });
		const validStorage = new InMemoryStorageAdapter<TCountSnapshot>({ id: 'valid' });
		vi.spyOn(saveStorage, 'save').mockRejectedValue(new Error('disk full'));
		const onError = vi.fn();
		const loop = new StorageSyncLoop<ITestModel>({
			store,
			onError,
			bindings: [
				{ ...countBinding(selectorStorage), select: () => { throw new Error('selector failed'); } },
				countBinding(saveStorage),
				countBinding(validStorage),
			],
		}).start();

		store.commit({ count: 1, name: 'one' });
		await loop.whenIdle();

		expect(loop.getFailures().map(failure => [failure.storageId, failure.phase])).toEqual([
			['selector', 'select'],
			['save', 'save'],
		]);
		expect(onError).toHaveBeenCalledTimes(2);
		expect(await validStorage.load()).toEqual({ count: 1 });
		loop.clearFailures();
		expect(loop.getFailures()).toEqual([]);
	});

	it('can explicitly persist the current snapshot without starting observation', async () => {
		const store = new ModelStore<ITestModel>({ count: 4, name: 'initial' });
		const storage = new InMemoryStorageAdapter<TCountSnapshot>({ id: 'manual' });
		const loop = new StorageSyncLoop({ store, bindings: [countBinding(storage)] });

		loop.requestSync();
		await loop.whenIdle();

		expect(await storage.load()).toEqual({ count: 4 });
		expect(loop.isRunning()).toBe(false);
	});

	it('rejects an invalid manually requested Data Model without hanging the loop', async () => {
		const store = new ModelStore<ITestModel>({ count: 4, name: 'initial' });
		const loop = new StorageSyncLoop({ store });

		expect(() => loop.requestSync(null as never)).toThrow(TypeError);
		await expect(loop.whenIdle()).resolves.toBeUndefined();
	});

	it('isolates the persistence drain from errors thrown by an onError observer', async () => {
		const store = new ModelStore<ITestModel>({ count: 0, name: 'initial' });
		const broken = new InMemoryStorageAdapter<TCountSnapshot>({ id: 'broken-observer' });
		const valid = new InMemoryStorageAdapter<TCountSnapshot>({ id: 'valid-observer' });
		vi.spyOn(broken, 'save').mockRejectedValue(new Error('offline'));
		const loop = new StorageSyncLoop({
			store,
			bindings: [countBinding(broken), countBinding(valid)],
			onError: () => { throw new Error('observer failed'); },
		}).start();

		store.commit({ count: 2, name: 'two' });
		await loop.whenIdle();

		expect(await valid.load()).toEqual({ count: 2 });
		expect(loop.getFailures()).toHaveLength(1);
	});

	it('waits for an in-flight write when stopped with flushing enabled', async () => {
		const store = new ModelStore<ITestModel>({ count: 0, name: 'initial' });
		const storage = new InMemoryStorageAdapter<TCountSnapshot>({ id: 'slow' });
		const save = Promise.withResolvers<void>();
		vi.spyOn(storage, 'save').mockReturnValue(save.promise);
		const loop = new StorageSyncLoop({ store, bindings: [countBinding(storage)] }).start();

		store.commit({ count: 1, name: 'one' });
		await Promise.resolve();
		let stopped = false;
		const stopping = loop.stop().then(() => {
			stopped = true;
		});
		await Promise.resolve();
		expect(stopped).toBe(false);

		save.resolve();
		await stopping;
		expect(stopped).toBe(true);
		expect(loop.isRunning()).toBe(false);
	});

	it('rejects duplicate Storage registrations', () => {
		const store = new ModelStore<ITestModel>({ count: 0, name: 'initial' });
		const storage = new InMemoryStorageAdapter<TCountSnapshot>({ id: 'duplicate' });
		const loop = new StorageSyncLoop({ store, bindings: [countBinding(storage)] });

		expect(() => loop.addStorage(countBinding(storage))).toThrow('already registered');
	});

	it('unsubscribes on stop and removes bindings idempotently', async () => {
		const store = new ModelStore<ITestModel>({ count: 0, name: 'initial' });
		const storage = new InMemoryStorageAdapter<TCountSnapshot>({ id: 'counter' });
		const save = vi.spyOn(storage, 'save');
		const loop = new StorageSyncLoop({ store });
		const remove = loop.addStorage(countBinding(storage));
		loop.start();

		store.commit({ count: 1, name: 'one' });
		await loop.whenIdle();
		remove();
		remove();
		store.commit({ count: 2, name: 'two' });
		await loop.stop();
		store.commit({ count: 3, name: 'three' });

		expect(save).toHaveBeenCalledOnce();
		expect(loop.isRunning()).toBe(false);
	});
});

describe('versioned Storage decorator', () => {
	it('migrates older snapshots and writes the current version envelope', async () => {
		const raw = new InMemoryStorageAdapter<{ version: number; data: unknown }>({
			id: 'versioned',
			initialSnapshot: { version: 1, data: { value: 2 } },
		});
		const storage = new VersionedStorageAdapter<{ count: number }>({
			storage: raw,
			version: 3,
			migrations: {
				1: data => ({ count: (data as { value: number }).value }),
				2: data => ({ count: (data as { count: number }).count + 1 }),
			},
		});

		expect(await storage.load()).toEqual({ count: 3 });
		await storage.save({ count: 7 });
		expect(await raw.load()).toEqual({ version: 3, data: { count: 7 } });
	});

	it('rejects snapshots from a newer version and missing migrations', async () => {
		const newer = new InMemoryStorageAdapter<{ version: number; data: unknown }>({
			id: 'newer',
			initialSnapshot: { version: 4, data: {} },
		});
		const missing = new InMemoryStorageAdapter<{ version: number; data: unknown }>({
			id: 'missing',
			initialSnapshot: { version: 1, data: {} },
		});

		await expect(new VersionedStorageAdapter({ storage: newer, version: 3 }).load()).rejects.toThrow('newer');
		await expect(new VersionedStorageAdapter({ storage: missing, version: 2 }).load()).rejects.toThrow('migration');
	});
});
