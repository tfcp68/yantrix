import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import {
	allModelPredicates,
	anyModelPredicates,
	composeModelTransformers,
	createModelFunctions,
	createModelPredicate,
	createModelTransformer,
	EffectScheduler,
	ModelStore,
	notModelPredicate,
	TModelPredicate,
	TModelSlicePredicate,
	TModelSliceTransformer,
	TReadonlyModel,
	whenModel,
} from '../src';

enum TestEvent {
	Add = 1,
	Rename = 2,
}

interface ITestEventMeta {
	[TestEvent.Add]: { amount: number };
	[TestEvent.Rename]: { name: string };
}

interface ICounterSlice {
	value: number;
	limit: number;
}

interface ITestModel {
	counter: ICounterSlice;
	name: string;
}

const event = { event: TestEvent.Add, meta: { amount: 2 } } as const;
const fx = createModelFunctions<ITestModel, TestEvent, ITestEventMeta>();
const onAdd = fx.forEvent<TestEvent.Add>();

describe('model functions', () => {
	it('shares one frozen set of standalone helpers across bindings', () => {
		expect(Object.isFrozen(fx)).toBe(true);
		expect(createModelFunctions<ITestModel>()).toBe(fx);
		expect(onAdd).toBe(fx);
		expect(fx.predicate).toBe(createModelPredicate);
		expect(fx.transformer).toBe(createModelTransformer);
		expect(fx.compose).toBe(composeModelTransformers);
		expect(fx.all).toBe(allModelPredicates);
		expect(fx.any).toBe(anyModelPredicates);
		expect(fx.not).toBe(notModelPredicate);
		expect(fx.when).toBe(whenModel);
	});

	it('exposes the metadata union for a Predicate bound to all Events', () => {
		const hasMeta = fx.predicate(model => model.name, (currentEvent, name) => {
			expectTypeOf(currentEvent.meta).toEqualTypeOf<ITestEventMeta[TestEvent] | null>();
			return currentEvent.meta !== null && name.length > 0;
		});
		const model = { counter: { value: 1, limit: 5 }, name: 'test' };
		expect(hasMeta(event, model)).toBe(true);
		expect(hasMeta({ event: TestEvent.Rename, meta: null }, model)).toBe(false);
	});

	it('defaults standalone Event Meta to unknown without contextual types', () => {
		const hasMeta = createModelPredicate(model => model, (currentEvent) => {
			expectTypeOf(currentEvent.meta).toBeUnknown();
			return currentEvent.meta !== null;
		});
		const unchanged = createModelTransformer(
			model => model,
			model => model,
			(currentEvent, slice) => {
				expectTypeOf(currentEvent.meta).toBeUnknown();
				return slice;
			},
		);

		const model = { name: 'test' };
		expect(hasMeta(event, model)).toBe(true);
		expect(unchanged(event, model)).toBe(model);
	});

	it('lifts a typed slice Predicate into a Model Predicate', () => {
		const predicate: TModelSlicePredicate<ICounterSlice, TestEvent.Add, ITestEventMeta> = (
			currentEvent,
			counter,
		) => {
			expectTypeOf(currentEvent.meta).toEqualTypeOf<{ amount: number } | null>();
			expectTypeOf(counter).toEqualTypeOf<Readonly<ICounterSlice>>();
			return counter.value + (currentEvent.meta?.amount ?? 0) <= counter.limit;
		};
		const canAdd = createModelPredicate(
			(model: Readonly<ITestModel>) => model.counter,
			predicate,
		);

		expect(canAdd(event, { counter: { value: 2, limit: 5 }, name: 'test' })).toBe(true);
		expect(canAdd(event, { counter: { value: 4, limit: 5 }, name: 'test' })).toBe(false);
	});

	it('lifts a typed slice Transformer without rebuilding an unchanged Model', () => {
		const replace = vi.fn((model: Readonly<ITestModel>, counter: ICounterSlice): ITestModel => ({
			...model,
			counter,
		}));
		const add: TModelSliceTransformer<ICounterSlice, TestEvent.Add, ITestEventMeta> = (
			currentEvent,
			counter,
		) => ({ ...counter, value: counter.value + (currentEvent.meta?.amount ?? 0) });
		const addToCounter = createModelTransformer(
			(model: Readonly<ITestModel>) => model.counter,
			replace,
			add,
		);
		const model = { counter: { value: 1, limit: 5 }, name: 'test' };

		expect(addToCounter(event, model)).toEqual({ counter: { value: 3, limit: 5 }, name: 'test' });

		const unchanged = createModelTransformer(
			(current: Readonly<ITestModel>) => current.counter,
			replace,
			(_currentEvent, counter) => counter,
		);
		expect(unchanged(event, model)).toBe(model);
		expect(replace).toHaveBeenCalledOnce();
	});

	it('preserves a read-only list selection through a no-op and a subsequent commit', () => {
		type TShop = { cart: { skus: string[] } };
		const initial: TShop = { cart: { skus: ['first'] } };
		const replace = vi.fn((model: TReadonlyModel<TShop>, skus: readonly string[]) => ({
			...model,
			cart: { ...model.cart, skus },
		}));
		const shop = createModelFunctions<TShop, TestEvent, ITestEventMeta>().forEvent<TestEvent.Add>();
		const keep = shop.transformer(model => model.cart.skus, replace, (_event, skus) => skus);
		expect(keep(event, initial)).toBe(initial);
		const append = shop.transformer(
			model => model.cart.skus,
			replace,
			(currentEvent, skus) => {
				expectTypeOf(skus).toEqualTypeOf<readonly string[]>();
				return currentEvent.meta?.amount ? [...skus, 'next'] : skus;
			},
		);
		const store = new ModelStore(initial);
		const notify = vi.fn();
		store.subscribe(notify);
		const scheduler = new EffectScheduler<TShop, TestEvent.Add, ITestEventMeta>({
			store,
			matrices: [{ [TestEvent.Add]: [append] }],
		});

		scheduler.enqueue({ event: TestEvent.Add, meta: { amount: 0 } });
		expect(scheduler.flush().changed).toBe(false);
		expect(store.get()).toBe(initial);
		expect(replace).not.toHaveBeenCalled();
		expect(notify).not.toHaveBeenCalled();

		scheduler.enqueue(event);
		expect(scheduler.flush().changed).toBe(true);
		expect(store.get().cart.skus).toEqual(['first', 'next']);
		expect(initial.cart.skus).toEqual(['first']);
		expect(notify).toHaveBeenCalledOnce();
	});

	it('composes Model Transformers from left to right', () => {
		const add = onAdd.transformer(
			model => model.counter,
			(model, counter) => ({ ...model, counter }),
			(currentEvent, counter) => {
				expectTypeOf(counter).toEqualTypeOf<TReadonlyModel<ICounterSlice>>();
				return { ...counter, value: counter.value + (currentEvent.meta?.amount ?? 0) };
			},
		);
		const capAtLimit = onAdd.transformer(
			model => model.counter,
			(model, counter) => ({ ...model, counter }),
			(_currentEvent, counter) => ({ ...counter, value: Math.min(counter.value, counter.limit) }),
		);
		const composed = onAdd.compose(add, capAtLimit);

		expect(composed(
			{ event: TestEvent.Add, meta: { amount: 10 } },
			{ counter: { value: 1, limit: 5 }, name: 'test' },
		)).toEqual({ counter: { value: 5, limit: 5 }, name: 'test' });
	});

	it('composes Model Predicates with short-circuit semantics', () => {
		const first: TModelPredicate<ITestModel, TestEvent.Add, ITestEventMeta> = vi.fn(() => false);
		const second: TModelPredicate<ITestModel, TestEvent.Add, ITestEventMeta> = vi.fn(() => true);
		const model = { counter: { value: 1, limit: 5 }, name: 'test' };

		expect(allModelPredicates(first, second)(event, model)).toBe(false);
		expect(second).not.toHaveBeenCalled();
		expect(anyModelPredicates(first, second)(event, model)).toBe(true);
		expect(notModelPredicate(first)(event, model)).toBe(true);
	});

	it('creates an Effect by guarding a Model Transformer with a Predicate', () => {
		const model = { counter: { value: 4, limit: 5 }, name: 'test' };
		const canAdd = onAdd.predicate(
			current => current.counter,
			(currentEvent, counter) => {
				expectTypeOf(currentEvent.meta).toEqualTypeOf<ITestEventMeta[TestEvent.Add] | null>();
				expectTypeOf(counter).toEqualTypeOf<TReadonlyModel<ICounterSlice>>();
				return counter.value + (currentEvent.meta?.amount ?? 0) <= counter.limit;
			},
		);
		const add = onAdd.transformer(
			current => current.counter,
			(current, counter) => ({ ...current, counter }),
			(currentEvent, counter) => ({
				...counter,
				value: counter.value + (currentEvent.meta?.amount ?? 0),
			}),
		);
		const effect = onAdd.when(canAdd, add);

		expect(effect(event, model)).toBe(model);
		expect(effect(
			{ event: TestEvent.Add, meta: { amount: 1 } },
			model,
		)).toEqual({ counter: { value: 5, limit: 5 }, name: 'test' });
	});
});
