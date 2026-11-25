import { describe, expect, it } from 'vitest';
import { createInMemoryStorageAdapter, InMemoryStorageAdapter } from '../src';

describe('in-memory Storage', () => {
	it('loads, saves and clears snapshots through an optional clone boundary', async () => {
		const storage = createInMemoryStorageAdapter<{ count: number }>({
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
