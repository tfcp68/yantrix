import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import {
	allModelPredicates,
	anyModelPredicates,
	composeModelTransformers,
	createModelPredicate,
	createModelTransformer,
	notModelPredicate,
	TModelPredicate,
	TModelSlicePredicate,
	TModelSliceTransformer,
	whenModel,
} from '../src';

enum TestEvent {
	Add = 1,
	Rename = 2,
}

interface ITestEventMeta extends Record<TestEvent, unknown> {
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

describe('model functions', () => {
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
			(_currentEvent, counter) => counter as ICounterSlice,
		);
		expect(unchanged(event, model)).toBe(model);
		expect(replace).toHaveBeenCalledOnce();
	});

	it('composes Model Transformers from left to right', () => {
		const add = createModelTransformer(
			(model: Readonly<ITestModel>) => model.counter,
			(model, counter) => ({ ...model, counter }),
			(currentEvent, counter) => ({
				...counter,
				value: counter.value + (currentEvent.meta?.amount ?? 0),
			}),
		);
		const capAtLimit = createModelTransformer(
			(model: Readonly<ITestModel>) => model.counter,
			(model, counter) => ({ ...model, counter }),
			(_currentEvent, counter) => ({ ...counter, value: Math.min(counter.value, counter.limit) }),
		);
		const composed = composeModelTransformers(add, capAtLimit);

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
		const canAdd = createModelPredicate(
			(current: Readonly<ITestModel>) => current.counter,
			(currentEvent, counter) => counter.value + (currentEvent.meta?.amount ?? 0) <= counter.limit,
		);
		const add = createModelTransformer(
			(current: Readonly<ITestModel>) => current.counter,
			(current, counter) => ({ ...current, counter }),
			(currentEvent, counter) => ({
				...counter,
				value: counter.value + (currentEvent.meta?.amount ?? 0),
			}),
		);
		const effect = whenModel(canAdd, add);

		expect(effect(event, model)).toBe(model);
		expect(effect(
			{ event: TestEvent.Add, meta: { amount: 1 } },
			model,
		)).toEqual({ counter: { value: 5, limit: 5 }, name: 'test' });
	});
});
