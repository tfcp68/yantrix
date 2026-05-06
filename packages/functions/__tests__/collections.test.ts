import { describe, expect, it } from 'vitest';
import { Transformers } from '../src';

describe('collection Transformers', () => {
	const { filterBy, find, sample } = Transformers;

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
});
