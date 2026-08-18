import { describe, expect, it } from 'vitest';
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
		expect(removeModelProperty(source, 'label')).toEqual({ count: 1 });
		expect(removeModelProperty(source, 'missing' as never)).toBe(source);
		expect(source).toEqual({ count: 1, label: 'one' });
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
