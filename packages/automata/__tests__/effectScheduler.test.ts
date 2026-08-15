import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { EffectScheduler, ModelStore, TAutomataEffect, TEffectMatrix } from '../src';

enum TestEvent {
	Increment = 1,
	Rename = 2,
	Ignored = 3,
}

interface ITestEventMeta extends Record<TestEvent, unknown> {
	[TestEvent.Increment]: { amount: number };
	[TestEvent.Rename]: { name: string };
	[TestEvent.Ignored]: null;
}

interface ITestModel {
	count: number;
	name: string;
}

const initialModel = (): ITestModel => ({ count: 0, name: 'initial' });

describe('effectScheduler', () => {
	it('preserves event metadata types in an Effect Matrix', () => {
		const increment: TAutomataEffect<ITestModel, TestEvent.Increment, ITestEventMeta> = (event, model) => {
			expectTypeOf(event.meta).toEqualTypeOf<{ amount: number } | null>();
			return { ...model, count: model.count + (event.meta?.amount ?? 0) };
		};
		const matrix: TEffectMatrix<ITestModel, TestEvent, ITestEventMeta> = {
			[TestEvent.Increment]: [increment],
		};

		expect(matrix[TestEvent.Increment]).toEqual([increment]);
	});

	it('does not update the model until the batch is flushed', () => {
		const store = new ModelStore(initialModel());
		const scheduler = new EffectScheduler({
			store,
			matrices: [{
				[TestEvent.Increment]: [
					(event, model) => ({ ...model, count: model.count + (event.meta?.amount ?? 0) }),
				],
			}],
		});

		scheduler.enqueue({ event: TestEvent.Increment, meta: { amount: 2 } });

		expect(store.get()).toEqual(initialModel());
		expect(scheduler.pendingCount).toBe(1);
	});

	it('applies queued effects in event, matrix, and declaration order', () => {
		const store = new ModelStore(initialModel());
		const scheduler = new EffectScheduler<ITestModel, TestEvent, ITestEventMeta>({ store });
		scheduler.addMatrix({
			[TestEvent.Increment]: [
				(event, model) => ({ ...model, count: model.count + (event.meta?.amount ?? 0) }),
				(_event, model) => ({ ...model, name: `count:${model.count}` }),
			],
		});
		scheduler.addMatrix({
			[TestEvent.Increment]: [
				(_event, model) => ({ ...model, count: model.count * 2 }),
			],
			[TestEvent.Rename]: [
				(event, model) => ({ ...model, name: event.meta?.name ?? model.name }),
			],
		});

		scheduler
			.enqueue({ event: TestEvent.Increment, meta: { amount: 3 } })
			.enqueue({ event: TestEvent.Rename, meta: { name: 'done' } });
		const result = scheduler.flush();

		expect(store.get()).toEqual({ count: 6, name: 'done' });
		expect(result).toEqual({
			model: store.get(),
			previousModel: { count: 0, name: 'initial' },
			processedEvents: 2,
			appliedEffects: 4,
			changed: true,
		});
		expect(scheduler.pendingCount).toBe(0);
	});

	it('commits and notifies exactly once for a changing batch', () => {
		const store = new ModelStore(initialModel());
		const listener = vi.fn();
		store.subscribe(listener);
		const scheduler = new EffectScheduler<ITestModel, TestEvent, ITestEventMeta>({
			store,
			matrices: [{
				[TestEvent.Increment]: [
					(event, model) => ({ ...model, count: model.count + (event.meta?.amount ?? 0) }),
				],
			}],
		});

		scheduler
			.enqueue({ event: TestEvent.Increment, meta: { amount: 1 } })
			.enqueue({ event: TestEvent.Increment, meta: { amount: 2 } })
			.flush();

		expect(listener).toHaveBeenCalledOnce();
		expect(listener).toHaveBeenCalledWith({ count: 3, name: 'initial' }, { count: 0, name: 'initial' });
	});

	it('ignores events without effects and skips an unchanged commit', () => {
		const initial = initialModel();
		const store = new ModelStore(initial);
		const listener = vi.fn();
		store.subscribe(listener);
		const scheduler = new EffectScheduler<ITestModel, TestEvent, ITestEventMeta>({ store });

		scheduler.enqueue({ event: TestEvent.Ignored, meta: null });
		const result = scheduler.flush();

		expect(result.changed).toBe(false);
		expect(result.appliedEffects).toBe(0);
		expect(store.get()).toBe(initial);
		expect(listener).not.toHaveBeenCalled();
	});

	it('removes a matrix without affecting other registered matrices', () => {
		const store = new ModelStore(initialModel());
		const scheduler = new EffectScheduler<ITestModel, TestEvent, ITestEventMeta>({ store });
		const removeFirst = scheduler.addMatrix({
			[TestEvent.Increment]: [(_event, model) => ({ ...model, count: model.count + 100 })],
		});
		scheduler.addMatrix({
			[TestEvent.Increment]: [(event, model) => ({
				...model,
				count: model.count + (event.meta?.amount ?? 0),
			})],
		});

		removeFirst();
		removeFirst();
		scheduler.enqueue({ event: TestEvent.Increment, meta: { amount: 2 } }).flush();

		expect(store.get().count).toBe(2);
	});

	it('keeps a failed batch atomic and consumes it before rethrowing', () => {
		const initial = initialModel();
		const store = new ModelStore(initial);
		const scheduler = new EffectScheduler<ITestModel, TestEvent, ITestEventMeta>({
			store,
			matrices: [{
				[TestEvent.Increment]: [
					(event, model) => ({ ...model, count: model.count + (event.meta?.amount ?? 0) }),
					() => { throw new Error('broken effect'); },
				],
			}],
		});
		scheduler.enqueue({ event: TestEvent.Increment, meta: { amount: 2 } });

		expect(() => scheduler.flush()).toThrow('broken effect');
		expect(store.get()).toBe(initial);
		expect(scheduler.pendingCount).toBe(0);
	});

	it('can explicitly clear a pending batch', () => {
		const store = new ModelStore(initialModel());
		const scheduler = new EffectScheduler<ITestModel, TestEvent, ITestEventMeta>({ store });

		scheduler.enqueue({ event: TestEvent.Ignored, meta: null }).clear();

		expect(scheduler.pendingCount).toBe(0);
		expect(scheduler.flush().processedEvents).toBe(0);
	});

	it('defers Events enqueued by an Effect to the next batch', () => {
		const store = new ModelStore(initialModel());
		const scheduler = new EffectScheduler<ITestModel, TestEvent, ITestEventMeta>({ store });
		scheduler.addMatrix({
			[TestEvent.Increment]: [(_event, model) => {
				scheduler.enqueue({ event: TestEvent.Rename, meta: { name: 'next batch' } });
				return { ...model, count: model.count + 1 };
			}],
			[TestEvent.Rename]: [(event, model) => ({ ...model, name: event.meta?.name ?? model.name })],
		});

		scheduler.enqueue({ event: TestEvent.Increment, meta: { amount: 1 } }).flush();

		expect(store.get()).toEqual({ count: 1, name: 'initial' });
		expect(scheduler.pendingCount).toBe(1);

		scheduler.flush();
		expect(store.get()).toEqual({ count: 1, name: 'next batch' });
	});

	it('rejects recursive flushes without partially committing the model', () => {
		const initial = initialModel();
		const store = new ModelStore(initial);
		const scheduler = new EffectScheduler<ITestModel, TestEvent, ITestEventMeta>({ store });
		scheduler.addMatrix({
			[TestEvent.Increment]: [(_event, model) => {
				scheduler.flush();
				return { ...model, count: model.count + 1 };
			}],
		});
		scheduler.enqueue({ event: TestEvent.Increment, meta: { amount: 1 } });

		expect(() => scheduler.flush()).toThrow('cannot flush recursively');
		expect(store.get()).toBe(initial);
	});

	it('rejects an invalid Effect result without committing it', () => {
		const initial = initialModel();
		const store = new ModelStore(initial);
		const scheduler = new EffectScheduler<ITestModel, TestEvent, ITestEventMeta>({
			store,
			matrices: [{
				[TestEvent.Increment]: [(() => null) as never],
			}],
		});
		scheduler.enqueue({ event: TestEvent.Increment, meta: { amount: 1 } });

		expect(() => scheduler.flush()).toThrow(TypeError);
		expect(store.get()).toBe(initial);
	});
});
