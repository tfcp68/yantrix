import { describe, expect, it, vi } from 'vitest';
import { ModelStore } from '../src';

interface ITestModel {
	count: number;
}

describe('modelStore', () => {
	it('exposes the initial model snapshot', () => {
		const initial = { count: 1 };
		const store = new ModelStore(initial);

		expect(store.get()).toBe(initial);
	});

	it('commits a new snapshot before notifying subscribers', () => {
		const initial = { count: 1 };
		const next = { count: 2 };
		const store = new ModelStore(initial);
		const listener = vi.fn((model: ITestModel, previousModel: ITestModel) => {
			expect(store.get()).toBe(next);
			expect(model).toBe(next);
			expect(previousModel).toBe(initial);
		});

		store.subscribe(listener);
		store.commit(next);

		expect(listener).toHaveBeenCalledOnce();
	});

	it('does not notify subscribers when the snapshot reference is unchanged', () => {
		const initial = { count: 1 };
		const store = new ModelStore(initial);
		const listener = vi.fn();
		store.subscribe(listener);

		store.commit(initial);

		expect(listener).not.toHaveBeenCalled();
	});

	it('returns an idempotent unsubscribe function', () => {
		const store = new ModelStore({ count: 1 });
		const listener = vi.fn();
		const unsubscribe = store.subscribe(listener);

		unsubscribe();
		unsubscribe();
		store.commit({ count: 2 });

		expect(listener).not.toHaveBeenCalled();
	});

	it('uses a stable subscriber snapshot for each commit', () => {
		const store = new ModelStore({ count: 1 });
		const lateListener = vi.fn();
		store.subscribe(() => store.subscribe(lateListener));

		store.commit({ count: 2 });

		expect(lateListener).not.toHaveBeenCalled();
		store.commit({ count: 3 });
		expect(lateListener).toHaveBeenCalledOnce();
	});

	it('rejects non-object snapshots at runtime', () => {
		expect(() => new ModelStore(null as never)).toThrow(TypeError);

		const store = new ModelStore({ count: 1 });
		expect(() => store.commit(null as never)).toThrow(TypeError);
		expect(store.get()).toEqual({ count: 1 });
	});

	it('rejects a non-function subscriber at runtime', () => {
		const store = new ModelStore({ count: 1 });

		expect(() => store.subscribe(null as never)).toThrow(TypeError);
	});
});
