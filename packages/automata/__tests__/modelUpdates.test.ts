import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import {
	appendModelItem,
	mergeModelObject,
	removeModelItem,
	removeModelProperty,
	setModelProperty,
	updateModelItem,
	updateModelProperty,
} from '../src';

describe('immutable model update helpers', () => {
	it('sets and updates Object properties without mutating the source', () => {
		const source = { count: 1, label: 'one' };

		const set = setModelProperty(source, 'count', 2);
		const updated = updateModelProperty(source, 'count', count => count + 2);

		expect(set).toEqual({ count: 2, label: 'one' });
		expect(updated).toEqual({ count: 3, label: 'one' });
		expect(source).toEqual({ count: 1, label: 'one' });
		expect(setModelProperty(source, 'count', 1)).toBe(source);
		expect(updateModelProperty(source, 'count', count => count)).toBe(source);
	});

	it('merges and removes Object properties with structural sharing on no-op', () => {
		const source = { count: 1, label: 'one' };

		expect(mergeModelObject(source, { count: 2 })).toEqual({ count: 2, label: 'one' });
		expect(mergeModelObject(source, { count: 1 })).toBe(source);
		const removeKey = (key: string) => removeModelProperty(source, key);
		expectTypeOf<ReturnType<typeof removeKey>>().not.toMatchTypeOf<{ label: string }>();
		expect(removeKey('label')).toEqual({ count: 1 });
		expect(removeModelProperty(source, 'missing')).toBe(source);
		expect(source).toEqual({ count: 1, label: 'one' });
	});

	it('rejects arrays in Object helpers before attempting an update', () => {
		const source = [10, 20];
		const increment = vi.fn((n: number) => n + 1);

		// @ts-expect-error An array is not an Object helper target.
		expect(() => setModelProperty(source, 0, 12)).toThrow(TypeError);
		// @ts-expect-error An array is not an Object helper target.
		expect(() => updateModelProperty(source, 0, increment)).toThrow(TypeError);
		// @ts-expect-error An array is not an Object helper target.
		expect(() => mergeModelObject(source, [12])).toThrow(TypeError);
		// @ts-expect-error An array is not an Object helper target.
		expect(() => removeModelProperty(source, 0)).toThrow(TypeError);
		expect(increment).not.toHaveBeenCalled();
		expect(source).toEqual([10, 20]);
	});

	it('widens tuple results while preserving list mutability', () => {
		const pair: [string, number] = ['ready', 4];
		const readonlyPair: readonly [string, number] = pair;
		const updated = updateModelItem(pair, 0, label => label.toUpperCase());
		const removed = removeModelItem(readonlyPair, 0);

		expectTypeOf(updated).toEqualTypeOf<Array<string | number>>();
		expectTypeOf(removed).toEqualTypeOf<ReadonlyArray<string | number>>();
		expect(updated).toEqual(['READY', 4]);
		expect(removed).toEqual([4]);
		expect(readonlyPair).toEqual(['ready', 4]);
	});

	it('appends, updates, and removes List items without mutating the source', () => {
		const source = [{ id: 1, value: 'one' }, { id: 2, value: 'two' }];

		const appended = appendModelItem(source, { id: 3, value: 'three' });
		const updated = updateModelItem(source, 1, item => ({ ...item, value: 'updated' }));
		const removed = removeModelItem(source, 0);

		expect(appended).toEqual([...source, { id: 3, value: 'three' }]);
		expect(updated).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'updated' }]);
		expect(updated[0]).toBe(source[0]);
		expect(removed).toEqual([{ id: 2, value: 'two' }]);
		expect(source).toEqual([{ id: 1, value: 'one' }, { id: 2, value: 'two' }]);
	});

	it('preserves a List reference for no-op or out-of-range updates', () => {
		const source = [{ id: 1 }];

		expect(updateModelItem(source, 0, item => item)).toBe(source);
		expect(updateModelItem(source, 2, item => item)).toBe(source);
		expect(removeModelItem(source, -1)).toBe(source);
	});
});
