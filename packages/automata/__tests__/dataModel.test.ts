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

	it('can deeply freeze snapshots through opt-in development checks', () => {
		const initial = { nested: { values: [1, 2] } };
		const store = new ModelStore(initial, { development: { freeze: true } });

		expect(Object.isFrozen(store.get())).toBe(true);
		expect(Object.isFrozen(store.get().nested)).toBe(true);
		expect(Object.isFrozen(store.get().nested.values)).toBe(true);

		const next = { nested: { values: [3] } };
		store.commit(next);
		expect(Object.isFrozen(next.nested.values)).toBe(true);
	});

	it('does not freeze snapshots by default', () => {
		const initial = { nested: { count: 1 } };
		const store = new ModelStore(initial);

		expect(Object.isFrozen(store.get())).toBe(false);
		expect(Object.isFrozen(store.get().nested)).toBe(false);
	});

	it('can reject non-serializable snapshots through opt-in development checks', () => {
		expect(() => new ModelStore(
			{ callback: () => undefined },
			{ development: { validateSerializable: true } },
		)).toThrow(/callback/);

		const initial = { count: 1 };
		const store = new ModelStore(initial, { development: { validateSerializable: true } });
		const listener = vi.fn();
		store.subscribe(listener);

		expect(() => store.commit({ count: Number.NaN })).toThrow(/count/);
		expect(store.get()).toBe(initial);
		expect(listener).not.toHaveBeenCalled();
	});

	it('rejects circular and non-anemic snapshots when serializability validation is enabled', () => {
		const circular: { self?: unknown } = {};
		circular.self = circular;

		expect(() => new ModelStore(circular, {
			development: { validateSerializable: true },
		})).toThrow(/circular/i);
		expect(() => new ModelStore({ createdAt: new Date() }, {
			development: { validateSerializable: true },
		})).toThrow(/createdAt/);

		const list = [1, 2] as number[] & { metadata?: string };
		list.metadata = 'silently omitted by JSON.stringify';
		expect(() => new ModelStore({ list }, {
			development: { validateSerializable: true },
		})).toThrow(/list/);
	});
});
