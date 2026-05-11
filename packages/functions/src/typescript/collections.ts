import { TNullable } from '@yantrix/utils';
import { TCollection } from './types/common';
import { isCollection, isIterable } from './types/guards';

function _deepEqual(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (a == null || b == null || typeof a !== typeof b) return false;
	if (typeof a !== 'object') return false;
	if (Array.isArray(a) !== Array.isArray(b)) return false;
	const ka = Object.keys(a as object);
	return ka.length === Object.keys(b as object).length && ka.every(k => _deepEqual((a as any)[k], (b as any)[k]));
}

function _parsePath(p: string | string[]): string[] {
	return Array.isArray(p)
		? p
		: String(p).replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
}

function _sampleSize<T>(arr: T[], n: number): T[] {
	const a = [...arr];
	const size = Math.min(Math.max(0, n), a.length);
	for (let i = 0; i < size; i++) {
		const r = i + (Math.random() * (a.length - i) | 0);
		[a[r], a[i]] = [a[i]!, a[r]!];
	}
	return a.slice(0, size);
}

// ┌───────────────────────────────────────────────────────────────────────────┐
// │                        List & String Transformers                         │
// └───────────────────────────────────────────────────────────────────────────┘

/**
 * Returns the length of a string.
 *
 * @category List/String Transformers
 * @param str - The string to evaluate.
 * @returns The length of the string.
 */
export function len(str: string): number;

/**
 * Returns the length of an array.
 *
 * @category List/String Transformers
 * @template T - The type of the elements in the array.
 * @param list - The array to evaluate.
 * @returns The length of the array.
 */
export function len<T>(list: T[]): number;
export function len<T>(iterable: string | T[]): number {
	return isIterable(iterable) ? (iterable as any).length : 0;
}

// ┌───────────────────────────────────────────────────────────────────────────┐
// │                            List Transformers                              │
// └───────────────────────────────────────────────────────────────────────────┘

/**
 * Looks up a value in a list and returns it if found.
 *
 * @category List Transformers
 * @template T - The type of the elements in the array.
 * @param list - The list to search.
 * @param value - The value to look for.
 * @returns The value if found, otherwise null.
 */
export function lookup<T>(list: T[], value: T): TNullable<T> {
	if (!Array.isArray(list)) return null;

	for (const item of list) {
		if (_deepEqual(item, value)) return item;
	}

	return null;
}

/**
 * Repeats a value a specified number of times and returns an array of the repeated values.
 *
 * @category List Transformers
 * @template T - The type of the elements in the array.
 * @param quantity - The number of times to repeat the value.
 * @param valueSample - The value to repeat.
 * @returns An array containing the repeated values.
 */

// ┌───────────────────────────────────────────────────────────────────────────┐
// │                           String Transformers                             │
// └───────────────────────────────────────────────────────────────────────────┘

/**
 * Returns a substring of a string.
 *
 * @category String Transformers
 * @param str - The string to extract the substring from.
 * @param start - The starting index of the substring.
 * @param end - The ending index of the substring (optional).
 * @returns The extracted substring.
 */
export function substr(str: string, start: number, end?: number): string {
	if (typeof str !== 'string' || !Number.isFinite(start) || (end != null && !Number.isFinite(end))) return '';
	return str.substring(start, end);
}

// ┌───────────────────────────────────────────────────────────────────────────┐
// │                         Collection Transformers                           │
// └───────────────────────────────────────────────────────────────────────────┘

/**
 * Returns a list of property values from a collection of objects.
 *
 * @category Collection Transformers
 * @param collection - The collection of objects to extract values from.
 * @param prop - The property name to extract.
 * @returns A list containing all property values from the collection items, in order of appearance.
 */
export function pluck(collection: TCollection, prop: string): any[] {
	return isCollection(collection) ? collection.map(item => item[prop]) : [];
}

/**
 * Filters a collection by matching a property to a value.
 *
 * @category Collection Transformers
 * @param collection - The collection to filter.
 * @param prop - The property name to match.
 * @param value - The value to match against.
 */
export function filterBy(collection: TCollection, prop: string, value: unknown): TCollection {
	return isCollection(collection)
		? collection.filter(obj => prop in obj && obj[prop as keyof typeof obj] === value)
		: [];
}

/**
 * Returns the first item in a collection where a property equals a value.
 *
 * @category Collection Transformers
 * @param collection - The collection to search.
 * @param prop - The property name to match.
 * @param value - The value to match against.
 */
export function find(collection: TCollection, prop: string, value: unknown): Record<string, unknown> | null {
	return isCollection(collection)
		? collection.find(obj => prop in obj && obj[prop as keyof typeof obj] === value) ?? null
		: null;
}

/**
 * Returns N random items from a list, or N random characters from a string.
 *
 * @category List/String Transformers
 * @param iterable - The string or array to sample from.
 * @param n - The number of items to return.
 */
export function sample(str: string, n: number): string;
export function sample<T>(list: T[], n: number): T[];
export function sample<T>(iterable: string | T[], n: number): string | T[] {
	if (typeof iterable === 'string') {
		return _sampleSize(iterable.split(''), n).join('');
	}
	return _sampleSize(iterable as T[], n);
}

// ┌───────────────────────────────────────────────────────────────────────────┐
// │                            Native Implementations                         │
// └───────────────────────────────────────────────────────────────────────────┘

export const left = <T>(arr: T[], n?: number): T[] => arr?.length ? arr.slice(0, n === undefined ? 1 : Math.max(0, n)) : [];
export const right = <T>(arr: T[], n?: number): T[] => {
	const l = arr?.length ?? 0;
	return l ? arr.slice(Math.max(0, l - (n === undefined ? 1 : Math.max(0, n)))) : [];
};
export const reverse = <T>(arr: T[]): T[] => arr == null ? arr : [...arr].reverse();
export const indexOf = <T>(arr: T[], val: T, from?: number): number => arr ? arr.indexOf(val, from) : -1;
export const repeat = (str: string, n: number): string => str == null ? '' : String(str).repeat(Math.max(0, n ?? 1));
export function sort(list: any[]): any[];
export function sort(collection: TCollection, keyName?: string, defaultValue?: any): TCollection;
export function sort(col: any[], keyName?: string, defaultValue: any = null): any[] {
	if (col == null) return [];
	const arr = [...col];
	if (keyName === undefined)
		return arr.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
	return arr.sort((a, b) => {
		const va = (a as any)[keyName] ?? defaultValue;
		const vb = (b as any)[keyName] ?? defaultValue;
		return va < vb ? -1 : va > vb ? 1 : 0;
	});
}
export function shuffle(str: string): string;
export function shuffle<T>(arr: T[]): T[];
export function shuffle<T>(input: string | T[]): string | T[] {
	if (typeof input === 'string') {
		const a = input.split('');
		for (let i = a.length - 1; i > 0; i--) {
			const r = Math.random() * (i + 1) | 0;
			[a[r], a[i]] = [a[i]!, a[r]!];
		}
		return a.join('');
	}
	const a = input == null ? [] : [...input];
	for (let i = a.length - 1; i > 0; i--) {
		const r = Math.random() * (i + 1) | 0;
		[a[r], a[i]] = [a[i]!, a[r]!];
	}
	return a;
}
export const concat = (...args: any[]): any[] => args.reduce((r, v) => r.concat(Array.isArray(v) ? v : [v]), []);
export const every = <T>(arr: T[], fn: (v: T) => boolean): boolean => arr.every(fn);
export const intersect = <T>(...arrays: T[][]): T[] => arrays.length ? arrays[0]!.filter(v => arrays.every(a => a.includes(v))) : [];
export const keys = (o: object): string[] => o == null ? [] : Object.keys(o);
export const merge = <T extends object>(obj: T, ...sources: any[]): T => {
	function _merge(target: any, src: any) {
		if (!src) return;
		for (const k of Object.keys(src)) {
			if (src[k] != null && typeof src[k] === 'object' && !Array.isArray(src[k]) && target[k] != null && typeof target[k] === 'object' && !Array.isArray(target[k]))
				_merge(target[k], src[k]);
			else target[k] = src[k];
		}
	}
	sources.forEach(s => _merge(obj, s));
	return obj;
};
export const omit = <T extends object>(obj: T, ...paths: string[]): Partial<T> => {
	if (obj == null) return {};
	const r = { ...obj };
	paths.flat().forEach(k => delete (r as any)[k]);
	return r;
};
export const padRight = (str: string, len: number, chars = ' '): string => {
	str = str == null ? '' : String(str);
	const d = len - str.length;
	if (d <= 0 || !chars) return str;
	return str + chars.repeat(Math.ceil(d / chars.length)).slice(0, d);
};
export const padLeft = (str: string, len: number, chars = ' '): string => {
	str = str == null ? '' : String(str);
	const d = len - str.length;
	if (d <= 0 || !chars) return str;
	return chars.repeat(Math.ceil(d / chars.length)).slice(0, d) + str;
};
export const pick = <T extends object>(obj: T, ...paths: string[]): Partial<T> => {
	if (obj == null) return {};
	const r: any = {};
	paths.flat().forEach((k) => {
		if (k in obj)
			r[k] = (obj as any)[k];
	});
	return r;
};
export const setAttr = (obj: any, path: string | string[], val: unknown): any => {
	if (obj == null) return obj;
	const ps = _parsePath(path as string);
	const cur: any = obj;
	let c = cur;
	for (let i = 0; i < ps.length - 1; i++) {
		const k = ps[i]!;
		if (c[k] == null || typeof c[k] !== 'object') c[k] = /^\d+$/.test(ps[i + 1]!) ? [] : {};
		c = c[k];
	}
	c[ps[ps.length - 1]!] = val;
	return obj;
};
export const unsetAttr = (obj: any, path: string | string[]): boolean => {
	if (obj == null) return true;
	const ps = _parsePath(path as string);
	let c = obj;
	for (let i = 0; i < ps.length - 1; i++) {
		c = c[ps[i]!];
		if (c == null) return true;
	}
	delete c[ps[ps.length - 1]!];
	return true;
};
export const values = (o: object): any[] => o == null ? [] : Object.values(o);
export const zip = <T>(...arrays: T[][]): (T | undefined)[][] => {
	const n = arrays.length ? Math.max(...arrays.map(a => a?.length ?? 0)) : 0;
	return Array.from({ length: n }, (_, i) => arrays.map(a => a?.[i]));
};
