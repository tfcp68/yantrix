import { describe, expect, it } from 'vitest';
import { Transformers } from '../src';

describe('collection Transformers', () => {
	const { filterBy, find, sample, sort, shuffle } = Transformers;

	describe('filterBy()', () => {
		const items = [{ n: 1 }, { n: 2 }, { n: 3 }, { n: 1 }];

		it('returns items matching prop === value', () => {
			expect(filterBy(items, 'n', 1)).toStrictEqual([{ n: 1 }, { n: 1 }]);
		});

		it('returns empty array when no match', () => {
			expect(filterBy(items, 'n', 99)).toStrictEqual([]);
		});

		it('returns empty array for non-collection input', () => {
			expect(filterBy(null as any, 'n', 1)).toStrictEqual([]);
			expect(filterBy('str' as any, 'n', 1)).toStrictEqual([]);
		});

		it('returns empty array for empty collection', () => {
			expect(filterBy([], 'n', 1)).toStrictEqual([]);
		});

		it('ignores items missing the property', () => {
			expect(filterBy([{ n: 1 }, { x: 1 }] as any, 'n', 1)).toStrictEqual([{ n: 1 }]);
		});
	});

	describe('find()', () => {
		const items = [{ n: 1, label: 'a' }, { n: 2, label: 'b' }, { n: 3, label: 'c' }];

		it('returns first item where prop === value', () => {
			expect(find(items, 'n', 2)).toStrictEqual({ n: 2, label: 'b' });
		});

		it('returns null when no match', () => {
			expect(find(items, 'n', 99)).toBeNull();
		});

		it('returns null for non-collection input', () => {
			expect(find(null as any, 'n', 1)).toBeNull();
		});

		it('returns null for empty collection', () => {
			expect(find([], 'n', 1)).toBeNull();
		});

		it('returns first match when multiple exist', () => {
			const dupes = [{ n: 1, i: 0 }, { n: 1, i: 1 }];
			expect(find(dupes as any, 'n', 1)).toStrictEqual({ n: 1, i: 0 });
		});
	});

	describe('sample()', () => {
		it('returns N random characters from string', () => {
			const result = sample('abcdef', 3);
			expect(typeof result).toBe('string');
			expect(result).toHaveLength(3);
			for (const ch of result) {
				expect('abcdef').toContain(ch);
			}
		});

		it('returns N random items from array', () => {
			const source = [1, 2, 3, 4, 5];
			const result = sample(source, 3);
			expect(result).toHaveLength(3);
			for (const item of result) {
				expect(source).toContain(item);
			}
		});

		it('returns empty string when n=0', () => {
			expect(sample('abc', 0)).toBe('');
		});

		it('returns empty array when n=0', () => {
			expect(sample([1, 2, 3], 0)).toStrictEqual([]);
		});

		it('no duplicate items when n <= source length', () => {
			const result = sample([1, 2, 3, 4, 5], 5);
			expect(new Set(result).size).toBe(5);
		});
	});

	describe('sort()', () => {
		it('sorts numbers ascending', () => {
			expect(sort([3, 1, 4, 1, 5])).toStrictEqual([1, 1, 3, 4, 5]);
		});

		it('sorts strings ascending', () => {
			expect(sort(['banana', 'apple', 'cherry'])).toStrictEqual(['apple', 'banana', 'cherry']);
		});

		it('returns empty array for empty input', () => {
			expect(sort([])).toStrictEqual([]);
		});

		it('returns empty array for null input', () => {
			expect(sort(null as any)).toStrictEqual([]);
		});

		it('does not mutate original array', () => {
			const input = [3, 1, 2];
			sort(input);
			expect(input).toStrictEqual([3, 1, 2]);
		});

		it('sorts collection by keyName', () => {
			const col = [{ id: 3 }, { id: 1 }, { id: 2 }];
			expect(sort(col, 'id')).toStrictEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
		});

		it('sorts collection by keyName with defaultValue for missing keys', () => {
			const col = [{ id: 3 }, { name: 'x' }, { id: 1 }];
			expect(sort(col as any, 'id', 0)).toStrictEqual([{ name: 'x' }, { id: 1 }, { id: 3 }]);
		});
	});

	describe('shuffle()', () => {
		it('returns string of same length with same characters', () => {
			const result = shuffle('hello');
			expect(typeof result).toBe('string');
			expect(result).toHaveLength(5);
			expect(result.split('').sort()
				.join('')).toBe('ehllo');
		});

		it('returns array with same items in some order', () => {
			const input = [1, 2, 3, 4, 5];
			const result = shuffle(input);
			expect(result).toHaveLength(5);
			expect(result.slice().sort((a, b) => a - b)).toStrictEqual([1, 2, 3, 4, 5]);
		});

		it('does not mutate original array', () => {
			const input = [1, 2, 3];
			shuffle(input);
			expect(input).toStrictEqual([1, 2, 3]);
		});

		it('returns empty string for empty string', () => {
			expect(shuffle('')).toBe('');
		});

		it('returns empty array for empty array', () => {
			expect(shuffle([])).toStrictEqual([]);
		});
	});

	describe('setAttr()', () => {
		const { setAttr } = Transformers;

		it('returns a clone with the key set and leaves the input untouched', () => {
			const obj = { a: 1 };
			const r = setAttr(obj, 'b', 2);
			expect(r).toStrictEqual({ a: 1, b: 2 });
			expect(r).not.toBe(obj);
			expect(obj).toStrictEqual({ a: 1 });
		});

		it('copies along a nested path and shares untouched branches', () => {
			const obj = { x: { y: 1 }, z: { w: 2 } };
			const r = setAttr(obj, 'x.y', 5);
			expect(r).toStrictEqual({ x: { y: 5 }, z: { w: 2 } });
			expect(obj.x.y).toBe(1);
			expect(r.x).not.toBe(obj.x);
			expect(r.z).toBe(obj.z);
		});

		it('creates missing containers without touching the input', () => {
			const obj = {};
			expect(setAttr(obj, 'a[0].b', 1)).toStrictEqual({ a: [{ b: 1 }] });
			expect(obj).toStrictEqual({});
		});

		it('clones arrays along the path', () => {
			const obj = { list: [1, 2] };
			const r = setAttr(obj, 'list[1]', 9);
			expect(r.list).toStrictEqual([1, 9]);
			expect(Array.isArray(r.list)).toBe(true);
			expect(obj.list).toStrictEqual([1, 2]);
		});

		it('returns null input as is', () => {
			expect(setAttr(null, 'a', 1)).toBeNull();
		});
	});

	describe('unsetAttr()', () => {
		const { unsetAttr } = Transformers;

		it('returns a clone without the key and leaves the input untouched', () => {
			const obj = { a: 1, b: 2 };
			const r = unsetAttr(obj, 'b');
			expect(r).toStrictEqual({ a: 1 });
			expect(obj).toStrictEqual({ a: 1, b: 2 });
		});

		it('removes a nested key by copying along the path', () => {
			const obj = { x: { y: 1, k: 2 }, z: { w: 3 } };
			const r = unsetAttr(obj, 'x.k');
			expect(r).toStrictEqual({ x: { y: 1 }, z: { w: 3 } });
			expect(obj.x).toStrictEqual({ y: 1, k: 2 });
			expect(r.z).toBe(obj.z);
		});

		it('returns the input when the path does not exist', () => {
			const obj = { a: 1 };
			expect(unsetAttr(obj, 'b.c')).toStrictEqual({ a: 1 });
		});

		it('returns null input as is', () => {
			expect(unsetAttr(null, 'a')).toBeNull();
		});
	});
});
