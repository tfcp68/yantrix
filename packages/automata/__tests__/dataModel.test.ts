import { describe, expect, it, vi } from 'vitest';
import { deepFreezeModel, ModelStore } from '../src';

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
		store.commit({ ...initial });
		expect(listener).toHaveBeenCalledOnce();
	});

	it('keeps the committed snapshot when a subscriber throws and skips later subscribers', () => {
		const store = new ModelStore({ count: 0 });
		const next = { count: 1 };
		const failure = new Error('subscriber failed');
		const later = vi.fn();
		store.subscribe(() => {
			throw failure;
		});
		store.subscribe(later);

		expect(() => store.commit(next)).toThrow(failure);
		expect(store.get()).toBe(next);
		expect(later).not.toHaveBeenCalled();
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

	it('skips validation and freezing when re-committing the current snapshot', () => {
		const ownKeys = vi.fn(Reflect.ownKeys);
		const model = new Proxy({ values: [1, 2] }, { ownKeys });
		const store = new ModelStore(model, { development: { freeze: true, validateSerializable: true } });
		expect(ownKeys).toHaveBeenCalled();
		ownKeys.mockClear();

		store.commit(model);
		expect(ownKeys).not.toHaveBeenCalled();
	});

	it('reuses a deeply frozen subtree on a later commit', () => {
		const ownKeys = vi.fn(Reflect.ownKeys);
		const values = [1, 2];
		const shared = new Proxy({ values }, { ownKeys });
		const store = new ModelStore({ shared, count: 0 }, { development: { freeze: true } });
		expect(Object.isFrozen(values)).toBe(true);
		ownKeys.mockClear();

		store.commit({ shared, count: 1 });
		expect(ownKeys).not.toHaveBeenCalled();
	});

	it('descends into externally shallow-frozen objects', () => {
		const parent = Object.freeze({ child: {} });
		deepFreezeModel(parent);
		expect(Object.isFrozen(parent.child)).toBe(true);
	});

	it('retries a partially frozen cycle when its first traversal failed', () => {
		const leaf = {};
		let fail = true;
		const flaky = new Proxy({ leaf }, {
			preventExtensions(target) {
				if (fail) throw new Error('freeze interrupted');
				return Reflect.preventExtensions(target);
			},
		});
		const branch: { parent?: object } = {};
		const root = { branch, flaky };
		branch.parent = root;

		expect(() => deepFreezeModel(root)).toThrow('freeze interrupted');
		fail = false;
		deepFreezeModel(branch);
		expect(Object.isFrozen(leaf)).toBe(true);
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

	it('rejects array element accessors without invoking them', () => {
		const read = vi.fn(() => 1);
		const list = Object.defineProperty([0], '0', { enumerable: true, get: read });
		expect(() => new ModelStore({ list }, {
			development: { validateSerializable: true, freeze: true },
		})).toThrow(/list\[0\]/);
		expect(read).not.toHaveBeenCalled();
	});

	it('rejects non-enumerable array elements', () => {
		const list = Object.defineProperty([1], '0', { enumerable: false });
		expect(() => new ModelStore({ list }, {
			development: { validateSerializable: true },
		})).toThrow(/list\[0\]/);
	});

	it('rejects array subclasses with custom serialization', () => {
		class Rows extends Array<number> {
			toJSON() { return null; }
		}
		const rows = new Rows(1, 2);
		expect(() => new ModelStore({ rows }, {
			development: { validateSerializable: true },
		})).toThrow(/rows/);
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
