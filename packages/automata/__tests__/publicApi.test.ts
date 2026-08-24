import { describe, expect, expectTypeOf, it } from 'vitest';
import * as publicApi from '../src/index';

describe('public MVP API', () => {
	it.each([
		'AutomataSlice',
		'CoreLoop',
		'EffectScheduler',
		'IndexedDBStorageAdapter',
		'InMemoryStorageAdapter',
		'LocalStorageAdapter',
		'ModelStore',
		'StorageSyncLoop',
		'VersionedStorageAdapter',
		'allModelPredicates',
		'anyModelPredicates',
		'appendModelItem',
		'composeModelTransformers',
		'createModelPredicate',
		'createModelTransformer',
		'hydrateModel',
		'mergeModelObject',
		'notModelPredicate',
		'removeModelItem',
		'removeModelProperty',
		'setModelProperty',
		'updateModelItem',
		'updateModelProperty',
		'whenModel',
	] as const)('exports %s from the package entry point', (name) => {
		expect(publicApi[name]).toBeDefined();
	});

	it('exports the core type contracts through generated declarations', () => {
		expectTypeOf<publicApi.IDataModelStore<{ count: number }>>().toBeObject();
		expectTypeOf<publicApi.IStorageAdapter<{ count: number }>>().toBeObject();
		expectTypeOf<publicApi.IEffectScheduler<
			{ count: number },
			number,
			Record<number, unknown>
		>>().toBeObject();
		expectTypeOf<publicApi.TAutomataEffect<
			{ count: number },
			number,
			Record<number, unknown>
		>>().toBeFunction();
		expectTypeOf<publicApi.TEffectMatrix<
			{ count: number },
			number,
			Record<number, unknown>
		>>().toBeObject();
		expectTypeOf<publicApi.TModelPredicate<
			{ count: number },
			number,
			Record<number, unknown>
		>>().toBeFunction();
		expectTypeOf<publicApi.TModelTransformer<
			{ count: number },
			number,
			Record<number, unknown>
		>>().toBeFunction();
	});
});
