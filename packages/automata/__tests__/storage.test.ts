import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import {
	AbstractAgnosticStorageAdapter,
	createStorageAdapter,
	hydrateModel,
	IStorageAdapter,
	ModelStore,
	StorageHydrationSession,
	StorageHydrationSupersededError,
	StorageSyncLoop,
	TStorageBinding,
	VersionedStorageAdapter,
} from '../src';
import { createTestStorage } from './fixtures/storage';

interface ITestModel {
	count: number;
	name: string;
}

type TCountSnapshot = { count: number };

function countBinding(
	storage: IStorageAdapter<TCountSnapshot>,
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
		const first = createTestStorage<TCountSnapshot>({ id: 'first' });
		vi.spyOn(first, 'load').mockReturnValue(firstLoad.promise);
		const second = createTestStorage<TCountSnapshot>({ id: 'second', initialSnapshot: { count: 2 } });
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
		const broken = createTestStorage<TCountSnapshot>({ id: 'broken' });
		// JavaScript permits rejecting with null; this must not be confused with
		// a successful load of an empty Storage.
		vi.spyOn(broken, 'load').mockRejectedValue(null);
		const invalid = createTestStorage<TCountSnapshot>({
			id: 'invalid',
			initialSnapshot: { count: 4 },
		});
		const valid = createTestStorage<TCountSnapshot>({
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
		const storage = createTestStorage<TCountSnapshot>({ id: 'duplicate' });

		await expect(hydrateModel({ count: 0, name: 'initial' }, [
			countBinding(storage),
			countBinding(storage),
		])).rejects.toThrow('duplicate');
	});

	it('preserves a newer snapshot through startup and commits, while other bindings sync', async () => {
		const newer = { version: 2, data: { count: 8, extra: 'keep' } };
		const raw = createTestStorage<{ version: number; data: unknown }>({ id: 'counter', initialSnapshot: newer });
		const storage = new VersionedStorageAdapter<TCountSnapshot>({ storage: raw, version: 1 });
		const healthy = createTestStorage<TCountSnapshot>({ id: 'other' });
		const initial = { count: 0, name: 'initial' };
		const bindings = [countBinding(storage), countBinding(healthy)];
		const onHydrationError = vi.fn(() => {
			throw new Error('observer failed');
		});
		const hydration = await hydrateModel(initial, bindings, { onError: onHydrationError });
		expect(hydration.failures.map(f => [f.storageId, f.phase])).toEqual([['counter', 'load']]);
		expect(hydration.failures[0]?.error).toEqual(expect.objectContaining({ message: expect.stringContaining('newer') }));
		expect(onHydrationError.mock.calls).toEqual([[hydration.failures[0]]]);

		const store = new ModelStore(hydration.model);
		const onSyncError = vi.fn(async () => {
			throw new Error('observer rejected');
		});
		const loop = new StorageSyncLoop({ store, bindings, session: hydration.session, onError: onSyncError }).start();
		loop.requestSync();
		await loop.whenIdle();
		store.commit({ count: 42, name: 'edit' });
		await loop.whenIdle();
		expect(await raw.load()).toEqual(newer);
		expect(await healthy.load()).toEqual({ count: 42 });
		expect(loop.getFailures()).toEqual(hydration.failures);
		expect(onSyncError.mock.calls).toEqual([[hydration.failures[0]]]);

		await storage.clear();
		const recovered = await hydrateModel(store.get(), [countBinding(storage)], { session: hydration.session });
		expect(recovered.emptyStorageIds).toEqual(['counter']);
		loop.requestSync();
		await loop.stop();
		expect(await raw.load()).toEqual({ version: 1, data: { count: 42 } });
	});

	it('protects a connector after mapper failure, including against stale hydration completion', async () => {
		const storage = createTestStorage<TCountSnapshot>({ id: 'counter', initialSnapshot: { count: 8 } });
		const pending = Promise.withResolvers<TCountSnapshot>();
		vi.spyOn(storage, 'load').mockReturnValueOnce(pending.promise);
		const initial = { count: 0, name: 'initial' };
		const session = new StorageHydrationSession();
		const earlier = hydrateModel(initial, [countBinding(storage)], { session });
		const mapperError = new Error('incompatible model');
		const onError = vi.fn();
		const failure = await hydrateModel(initial, [{
			...countBinding(storage),
			hydrate: () => { throw mapperError; },
		}], { session, onError });
		expect(onError.mock.calls).toEqual([[{ storageId: 'counter', phase: 'hydrate', error: mapperError }]]);
		pending.resolve({ count: 8 });
		await expect(earlier).rejects.toBeInstanceOf(StorageHydrationSupersededError);

		const save = vi.spyOn(storage, 'save');
		const store = new ModelStore(failure.model);
		const loop = new StorageSyncLoop({ store, session, bindings: [countBinding(storage)] }).start();
		store.commit({ count: 42, name: 'edit' });
		await loop.whenIdle();
		expect(save).not.toHaveBeenCalled();
		expect(loop.getFailures()).toEqual(failure.failures);

		const repaired = await hydrateModel(store.get(), [countBinding(storage)], { session });
		expect(repaired.failures).toEqual([]);
		store.commit(repaired.model);
		await loop.stop();
		expect(save.mock.calls).toEqual([[{ count: 8 }]]);
	});

	it('rejects a superseded success before its model can overwrite a newer successful retry', async () => {
		const storage = createTestStorage<TCountSnapshot>({ id: 'shared', initialSnapshot: { count: 2 } });
		const pending = Promise.withResolvers<TCountSnapshot>();
		vi.spyOn(storage, 'load').mockReturnValueOnce(pending.promise);
		const binding = countBinding(storage);
		const map = vi.spyOn(binding, 'hydrate');
		const initial = { count: 0, name: 'initial' };
		const store = new ModelStore(initial);
		const session = new StorageHydrationSession();
		const loop = new StorageSyncLoop({ store, session, bindings: [binding] }).start();
		const onError = vi.fn();
		const restore = async () => {
			const result = await hydrateModel(store.get(), [binding], { session, onError });
			store.commit(result.model);
		};
		const earlier = restore();
		await restore();
		pending.resolve({ count: 1 });
		await expect(earlier).rejects.toBeInstanceOf(StorageHydrationSupersededError);
		await loop.stop();
		expect(map).toHaveBeenCalledOnce();
		expect(onError).not.toHaveBeenCalled();
		expect(store.get().count).toBe(2);
		expect(await storage.load()).toEqual({ count: 2 });
	});

	it('reports untouched connectors from a cancelled group and protects them until their own retry', async () => {
		const first = createTestStorage<TCountSnapshot>({ id: 'first', initialSnapshot: { count: 2 } });
		const second = createTestStorage<TCountSnapshot>({ id: 'second', initialSnapshot: { count: 8 } });
		const pending = Promise.withResolvers<TCountSnapshot>();
		vi.spyOn(first, 'load').mockReturnValueOnce(pending.promise);
		const bindings = [countBinding(first), countBinding(second)];
		const initial = { count: 0, name: 'initial' };
		const session = new StorageHydrationSession();
		const onError = vi.fn();
		const cancelled = hydrateModel(initial, bindings, { session, onError });
		const latest = await hydrateModel(initial, [countBinding(first)], { session });
		pending.resolve({ count: 1 });
		await expect(cancelled).rejects.toBeInstanceOf(StorageHydrationSupersededError);
		const failure = { storageId: 'second', phase: 'hydrate', error: expect.any(StorageHydrationSupersededError) };
		expect(onError.mock.calls).toEqual([[failure]]);

		const store = new ModelStore(latest.model);
		const loop = new StorageSyncLoop({ store, session, bindings }).start();
		store.commit({ ...initial, count: 3 });
		await loop.whenIdle();
		expect(await first.load()).toEqual({ count: 3 });
		expect(await second.load()).toEqual({ count: 8 });
		expect(loop.getFailures()).toEqual([failure]);

		const retry = await hydrateModel(store.get(), [countBinding(second)], { session });
		expect(retry.model.count).toBe(8);
		store.commit({ ...retry.model, count: 9 });
		await loop.stop();
		expect(await second.load()).toEqual({ count: 9 });
	});

	it('recognizes a retry started by a mapper before it returns', async () => {
		const storage = createTestStorage<TCountSnapshot>({ id: 'shared', initialSnapshot: { count: 3 } });
		const binding = countBinding(storage);
		const initial = { count: 0, name: 'initial' };
		const session = new StorageHydrationSession();
		const retry = vi.fn(() => hydrateModel(initial, [binding], { session }));
		const earlier = hydrateModel(initial, [{
			...binding,
			hydrate: (model, snapshot) => {
				void retry();
				return binding.hydrate(model, snapshot);
			},
		}], { session });
		await expect(earlier).rejects.toBeInstanceOf(StorageHydrationSupersededError);
		expect((await retry.mock.results[0]!.value).model.count).toBe(3);
	});

	it('isolates pending loads, failures and retries between loops sharing a connector', async () => {
		const storage = createTestStorage<TCountSnapshot>({ id: 'shared' });
		const bindings = [countBinding(storage)];
		const initial = { count: 0, name: 'initial' };
		const first = await hydrateModel(initial, bindings);
		const pending = Promise.withResolvers<TCountSnapshot>();
		vi.spyOn(storage, 'load').mockReturnValueOnce(pending.promise);
		const secondSession = new StorageHydrationSession();
		const secondHydration = hydrateModel(initial, bindings, { session: secondSession });

		const firstStore = new ModelStore(first.model);
		const secondStore = new ModelStore(initial);
		const firstLoop = new StorageSyncLoop({ store: firstStore, bindings, session: first.session }).start();
		const secondLoop = new StorageSyncLoop({ store: secondStore, bindings, session: secondSession }).start();
		const save = vi.spyOn(storage, 'save');
		firstStore.commit({ ...initial, count: 1 });
		secondStore.commit({ ...initial, count: 2 });
		await Promise.all([firstLoop.whenIdle(), secondLoop.whenIdle()]);
		expect(save.mock.calls).toEqual([[{ count: 1 }]]);

		pending.reject(new Error('offline'));
		const second = await secondHydration;
		expect(second.failures).toHaveLength(1);
		await firstLoop.hydrate();
		firstStore.commit({ ...initial, count: 3 });
		secondStore.commit({ ...initial, count: 4 });
		await Promise.all([firstLoop.whenIdle(), secondLoop.whenIdle()]);
		expect(save.mock.calls).toEqual([[{ count: 1 }], [{ count: 3 }]]);
		expect(firstLoop.getFailures()).toEqual([]);
		expect(secondLoop.getFailures()).toEqual(second.failures);

		const recovered = await secondLoop.hydrate();
		expect(recovered.failures).toEqual([]);
		secondLoop.requestSync();
		await Promise.all([firstLoop.stop(), secondLoop.stop()]);
		expect(await storage.load()).toEqual({ count: 4 });
	});

	it('retries hydration in the loop session, reports each failure once, and returns the model for the caller to commit', async () => {
		const storage = createTestStorage<TCountSnapshot>({ id: 'counter', initialSnapshot: { count: 7 } });
		const binding = countBinding(storage);
		const error = new Error('offline');
		vi.spyOn(storage, 'load')
			.mockRejectedValueOnce(error)
			.mockRejectedValueOnce(error);
		const initial = { count: 0, name: 'initial' };
		const startup = await hydrateModel(initial, [binding]);
		const store = new ModelStore(startup.model);
		const onError = vi.fn();
		const loop = new StorageSyncLoop({ store, session: startup.session, onError }).start();
		loop.addStorage(binding);
		const save = vi.spyOn(storage, 'save');

		const failed = await loop.hydrate();
		expect(failed.failures).toEqual([{ storageId: 'counter', phase: 'load', error }]);
		expect(onError.mock.calls).toEqual([[failed.failures[0]]]);
		store.commit({ count: 1, name: 'pending' });
		await loop.whenIdle();
		expect(save).not.toHaveBeenCalled();
		expect(loop.getFailures()).toEqual(failed.failures);
		expect(onError).toHaveBeenCalledOnce();

		const restored = await loop.hydrate({ count: 2, name: 'retry' });
		expect(restored.session).toBe(startup.session);
		expect(restored.model).toEqual({ count: 7, name: 'retry' });
		expect(store.get()).toEqual({ count: 1, name: 'pending' });
		store.commit(restored.model);
		await loop.stop();
		expect(save.mock.calls).toEqual([[{ count: 7 }]]);
	});

	it('can repersist an identical projection after a failed read is repaired', async () => {
		const storage = createTestStorage<number>({ id: 'counter' });
		const bindings: TStorageBinding<ITestModel, number>[] = [{
			storage,
			select: model => model.count,
			hydrate: (model, count) => ({ ...model, count }),
		}];
		const store = new ModelStore({ count: 8, name: 'initial' });
		const session = new StorageHydrationSession();
		const loop = new StorageSyncLoop({ store, bindings, session });
		loop.requestSync();
		await loop.whenIdle();
		expect(await storage.load()).toBe(8);

		vi.spyOn(storage, 'load').mockRejectedValueOnce(new Error('unavailable'));
		const failed = await hydrateModel(store.get(), bindings, { session });
		expect(failed.failures).toHaveLength(1);
		await storage.clear();
		await hydrateModel(store.get(), bindings, { session });
		loop.requestSync();
		await loop.whenIdle();
		expect(await storage.load()).toBe(8);
	});
});

describe('storage Sync Loop', () => {
	it('requires an explicit hydration session or write-only mode before syncing', () => {
		const store = new ModelStore<ITestModel>({ count: 0, name: 'initial' });
		// @ts-expect-error JavaScript callers can omit the session.
		expect(() => new StorageSyncLoop({ store })).toThrow('hydration session');
	});

	it('rejects hydration on a write-only loop', async () => {
		const store = new ModelStore({ count: 0, name: 'initial' });
		const storage = createTestStorage<TCountSnapshot>({ id: 'counter' });
		const load = vi.spyOn(storage, 'load');
		const loop = new StorageSyncLoop({ store, session: null, bindings: [countBinding(storage)] });
		await expect(loop.hydrate()).rejects.toThrow('write-only');
		expect(load).not.toHaveBeenCalled();
	});

	it('coalesces commits queued before a write starts and does not block ModelStore', async () => {
		const store = new ModelStore<ITestModel>({ count: 0, name: 'initial' });
		const storage = createTestStorage<TCountSnapshot>({ id: 'counter' });
		const save = vi.spyOn(storage, 'save');
		const loop = new StorageSyncLoop({ store, session: null, bindings: [countBinding(storage)] }).start();

		store.commit({ count: 1, name: 'one' });
		store.commit({ count: 2, name: 'two' });
		expect(save).not.toHaveBeenCalled();

		await loop.whenIdle();
		expect(save).toHaveBeenCalledOnce();
		expect(await storage.load()).toEqual({ count: 2 });
	});

	it('coalesces commits arriving during an in-flight write to the latest snapshot', async () => {
		const store = new ModelStore<ITestModel>({ count: 0, name: 'initial' });
		const storage = createTestStorage<TCountSnapshot>({ id: 'counter' });
		const firstSave = Promise.withResolvers<void>();
		const saved: number[] = [];
		vi.spyOn(storage, 'save').mockImplementation(async (snapshot) => {
			saved.push(snapshot.count);
			if (snapshot.count === 1) await firstSave.promise;
		});
		const loop = new StorageSyncLoop({ store, session: null, bindings: [countBinding(storage)] }).start();

		store.commit({ count: 1, name: 'one' });
		await Promise.resolve();
		store.commit({ count: 2, name: 'two' });
		store.commit({ count: 3, name: 'three' });
		firstSave.resolve();
		await loop.whenIdle();

		expect(saved).toEqual([1, 3]);
	});

	it('debounces commits across event-loop turns when configured', async () => {
		vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
		try {
			const store = new ModelStore<ITestModel>({ count: 0, name: 'initial' });
			const storage = createTestStorage<TCountSnapshot>({ id: 'debounced' });
			const save = vi.spyOn(storage, 'save');
			const loop = new StorageSyncLoop({
				store,
				session: null,
				bindings: [countBinding(storage)],
				debounceMs: 50,
			}).start();

			store.commit({ count: 1, name: 'one' });
			await vi.advanceTimersByTimeAsync(40);
			expect(save).not.toHaveBeenCalled();
			store.commit({ count: 2, name: 'two' });
			await vi.advanceTimersByTimeAsync(49);
			expect(save).not.toHaveBeenCalled();
			await vi.advanceTimersByTimeAsync(1);
			await loop.whenIdle();

			expect(save).toHaveBeenCalledOnce();
			expect(await storage.load()).toEqual({ count: 2 });
		} finally {
			vi.useRealTimers();
		}
	});

	it('skips a Storage when its selected projection is referentially unchanged', async () => {
		interface IProjectionModel { persistent: TCountSnapshot; transient: number }
		const persistent = { count: 1 };
		const store = new ModelStore<IProjectionModel>({ persistent, transient: 0 });
		const storage = createTestStorage<TCountSnapshot>({ id: 'projection' });
		const save = vi.spyOn(storage, 'save');
		const loop = new StorageSyncLoop<IProjectionModel>({
			store,
			session: null,
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
		const selectorStorage = createTestStorage<TCountSnapshot>({ id: 'selector' });
		const saveStorage = createTestStorage<TCountSnapshot>({ id: 'save' });
		const validStorage = createTestStorage<TCountSnapshot>({ id: 'valid' });
		vi.spyOn(saveStorage, 'save').mockRejectedValue(new Error('disk full'));
		const onError = vi.fn();
		const loop = new StorageSyncLoop<ITestModel>({
			store,
			session: null,
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
		const storage = createTestStorage<TCountSnapshot>({ id: 'manual' });
		const loop = new StorageSyncLoop({ store, session: null, bindings: [countBinding(storage)] });

		loop.requestSync();
		await loop.whenIdle();

		expect(await storage.load()).toEqual({ count: 4 });
		expect(loop.isRunning()).toBe(false);
	});

	it('rejects an invalid manually requested Data Model without hanging the loop', async () => {
		const store = new ModelStore<ITestModel>({ count: 4, name: 'initial' });
		const loop = new StorageSyncLoop({ store, session: null });

		expect(() => loop.requestSync(null as never)).toThrow(TypeError);
		await expect(loop.whenIdle()).resolves.toBeUndefined();
	});

	it('isolates the persistence drain from errors thrown by an onError observer', async () => {
		const store = new ModelStore<ITestModel>({ count: 0, name: 'initial' });
		const broken = createTestStorage<TCountSnapshot>({ id: 'broken-observer' });
		const valid = createTestStorage<TCountSnapshot>({ id: 'valid-observer' });
		vi.spyOn(broken, 'save').mockRejectedValue(new Error('offline'));
		const loop = new StorageSyncLoop({
			store,
			session: null,
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
		const storage = createTestStorage<TCountSnapshot>({ id: 'slow' });
		const save = Promise.withResolvers<void>();
		vi.spyOn(storage, 'save').mockReturnValue(save.promise);
		const loop = new StorageSyncLoop({
			store,
			session: null,
			bindings: [countBinding(storage)],
			debounceMs: 60_000,
		}).start();

		store.commit({ count: 1, name: 'one' });
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

	it('settles existing idle waiters when discarding a debounced write', async () => {
		const store = new ModelStore<ITestModel>({ count: 0, name: 'initial' });
		const storage = createTestStorage<TCountSnapshot>({ id: 'counter' });
		const loop = new StorageSyncLoop({
			store,
			session: null,
			bindings: [countBinding(storage)],
			debounceMs: 60_000,
		}).start();
		store.commit({ count: 1, name: 'pending' });
		const idle = vi.fn();
		const waiting = loop.whenIdle().then(idle);
		await loop.stop(false);
		expect(idle).toHaveBeenCalledOnce();
		await waiting;
		expect(await storage.load()).toBeNull();
	});

	it('discards pending work but settles waiters only after an active write finishes', async () => {
		const store = new ModelStore<ITestModel>({ count: 0, name: 'initial' });
		const storage = createTestStorage<TCountSnapshot>({ id: 'counter' });
		const active = Promise.withResolvers<void>();
		const save = vi.spyOn(storage, 'save').mockReturnValue(active.promise);
		const loop = new StorageSyncLoop({ store, session: null, bindings: [countBinding(storage)] }).start();
		store.commit({ count: 1, name: 'active' });
		await Promise.resolve();
		store.commit({ count: 2, name: 'pending' });
		const idle = vi.fn();
		const waiting = loop.whenIdle().then(idle);
		const stopping = loop.stop(false);
		await Promise.resolve();
		expect(idle).not.toHaveBeenCalled();
		active.resolve();
		await Promise.all([stopping, waiting]);
		expect(save.mock.calls).toEqual([[{ count: 1 }]]);
	});

	it('rejects duplicate Storage registrations', () => {
		const store = new ModelStore<ITestModel>({ count: 0, name: 'initial' });
		const storage = createTestStorage<TCountSnapshot>({ id: 'duplicate' });
		const loop = new StorageSyncLoop({ store, session: null, bindings: [countBinding(storage)] });

		expect(() => loop.addStorage(countBinding(storage))).toThrow('already registered');
	});

	it('unsubscribes on stop and removes bindings idempotently', async () => {
		const store = new ModelStore<ITestModel>({ count: 0, name: 'initial' });
		const storage = createTestStorage<TCountSnapshot>({ id: 'counter' });
		const save = vi.spyOn(storage, 'save');
		const loop = new StorageSyncLoop({ store, session: null });
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
		const raw = createTestStorage<{ version: number; data: unknown }>({
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
		const newer = createTestStorage<{ version: number; data: unknown }>({
			id: 'newer',
			initialSnapshot: { version: 4, data: {} },
		});
		const missing = createTestStorage<{ version: number; data: unknown }>({
			id: 'missing',
			initialSnapshot: { version: 1, data: {} },
		});

		await expect(new VersionedStorageAdapter({ storage: newer, version: 3 }).load()).rejects.toThrow('newer');
		await expect(new VersionedStorageAdapter({ storage: missing, version: 2 }).load()).rejects.toThrow('migration');
	});

	it('refuses to save over a newer envelope, even for a new connector instance', async () => {
		const raw = createTestStorage<{ version: number; data: unknown }>({ id: 'shared' });
		const older = new VersionedStorageAdapter<TCountSnapshot>({ storage: raw, version: 1 });
		expect(await older.load()).toBeNull();
		const newer = { version: 2, data: { count: 8, extra: 'keep' } };
		await raw.save(newer);
		await expect(older.save({ count: 0 })).rejects.toThrow('newer');
		const reopened = new VersionedStorageAdapter<TCountSnapshot>({ storage: raw, version: 1 });
		await expect(reopened.save({ count: 0 })).rejects.toThrow('newer');
		expect(await raw.load()).toEqual(newer);
	});
});

describe('storage adapter factory', () => {
	it('preserves a custom base constructor, its members and its snapshot type', async () => {
		abstract class NamespacedStorage extends AbstractAgnosticStorageAdapter<number> {
			static readonly separator = '/';

			constructor(id: string, private readonly namespace: string) {
				super({ id });
			}

			public getKey() {
				return `${this.namespace}${NamespacedStorage.separator}${this.id}`;
			}
		}

		class Counts extends createStorageAdapter(NamespacedStorage) {
			protected override read(): number { return 7; }
			protected override write(_snapshot: number): void {}
			protected override remove(): void {}
		}

		expectTypeOf(Counts).constructorParameters.toEqualTypeOf<[string, string]>();
		const storage = new Counts('count', 'app');
		expectTypeOf(storage.load).returns.toEqualTypeOf<Promise<number | null>>();
		expectTypeOf<Parameters<typeof storage.save>>().toEqualTypeOf<[number]>();
		expect(Counts.separator).toBe('/');
		expect(storage.getKey()).toBe('app/count');
		await expect(storage.load()).resolves.toBe(7);
	});
});
