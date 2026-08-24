import { describe, expect, expectTypeOf, it } from 'vitest';
import * as publicApi from '../src/index';

describe('@yantrix/core MVP facade', () => {
	it.each([
		'AutomataSlice',
		'CoreLoop',
		'EffectScheduler',
		'LocalStorageAdapter',
		'ModelStore',
		'StorageSyncLoop',
		'createModelPredicate',
		'createModelTransformer',
		'hydrateModel',
		'whenModel',
	] as const)('re-exports %s', (name) => {
		expect(publicApi[name]).toBeDefined();
	});

	it('re-exports the public contracts', () => {
		expectTypeOf<publicApi.IDataModelStore<{ value: number }>>().toBeObject();
		expectTypeOf<publicApi.IStorageAdapter<{ value: number }>>().toBeObject();
		expectTypeOf<publicApi.IEffectScheduler<
			{ value: number },
			number,
			Record<number, unknown>
		>>().toBeObject();
	});
});
