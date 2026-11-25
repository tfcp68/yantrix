import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ModelStore, StorageSyncLoop } from '../src';
import { createTestStorage } from './fixtures/storage';

function createLoop(debounceMs: number, maxWaitMs?: number) {
	const store = new ModelStore({ revision: 0 });
	const storage = createTestStorage<number>({ id: 'revisions' });
	const save = vi.spyOn(storage, 'save');
	const loop = new StorageSyncLoop({
		store,
		session: null,
		bindings: [{
			storage,
			select: model => model.revision,
			hydrate: (_model, revision: number) => ({ revision }),
		}],
		debounceMs,
		maxWaitMs,
	}).start();
	return { store, save, loop };
}

describe('storage sync loop maximum debounce wait', () => {
	beforeEach(() => {
		vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it.each([
		{ debounceMs: 50, maxWaitMs: 100, deadline: 100 },
		{ debounceMs: 150, maxWaitMs: undefined, deadline: 1000 },
		{ debounceMs: 1250, maxWaitMs: undefined, deadline: 1250 },
	])('saves the latest continuous commit every $deadline ms', async ({ debounceMs, maxWaitMs, deadline }) => {
		const { store, save, loop } = createLoop(debounceMs, maxWaitMs);
		for (let burst = 0; burst < 2; burst++) {
			for (let elapsed = 0; elapsed < deadline; elapsed += 25) {
				store.commit({ revision: burst * deadline + elapsed });
				await vi.advanceTimersByTimeAsync(24);
				expect(save).toHaveBeenCalledTimes(burst);
				await vi.advanceTimersByTimeAsync(1);
			}
			expect(save).toHaveBeenCalledTimes(burst + 1);
			expect(save).toHaveBeenLastCalledWith((burst + 1) * deadline - 25);
		}
		await loop.stop();
	});

	it('starts an overdue save as soon as the previous write settles', async () => {
		const { store, save, loop } = createLoop(50, 100);
		const active = Promise.withResolvers<void>();
		save.mockReturnValueOnce(active.promise);
		store.commit({ revision: 1 });
		await vi.advanceTimersByTimeAsync(50);
		expect(save.mock.calls).toEqual([[1]]);

		for (let revision = 2; revision <= 7; revision++) {
			store.commit({ revision });
			await vi.advanceTimersByTimeAsync(20);
		}
		expect(save.mock.calls).toEqual([[1]]);
		active.resolve();
		await vi.advanceTimersByTimeAsync(0);
		expect(save.mock.calls).toEqual([[1], [7]]);
		await loop.stop();
	});

	it('preserves the remaining debounce interval after a short in-flight write', async () => {
		const { store, save, loop } = createLoop(50, 100);
		const active = Promise.withResolvers<void>();
		save.mockReturnValueOnce(active.promise);
		store.commit({ revision: 1 });
		await vi.advanceTimersByTimeAsync(50);
		store.commit({ revision: 2 });
		await vi.advanceTimersByTimeAsync(40);
		active.resolve();
		await vi.advanceTimersByTimeAsync(9);
		expect(save.mock.calls).toEqual([[1]]);
		await vi.advanceTimersByTimeAsync(1);
		expect(save.mock.calls).toEqual([[1], [2]]);
		await loop.stop();
	});

	it.each([49, Number.POSITIVE_INFINITY, Number.NaN])('rejects an invalid maxWaitMs of %s', (maxWaitMs) => {
		expect(() => createLoop(50, maxWaitMs)).toThrow('maxWaitMs');
	});
});
