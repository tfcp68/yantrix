import * as _ from 'lodash-es';
import { TCollection, TNullable } from './types/common';
import { isCollection } from './types/guards';
import { ERRORS } from './utils/errors';
import { variadic } from './utils/utils';

function invalid(errorKey: keyof typeof ERRORS): never {
	throw new TypeError(ERRORS[errorKey]);
}

// Arithmetic transformers
export const add = variadic<number, number | null>((nums) => {
	return nums.length
		? _.reduce(nums, (a, n) => _.isNumber(n) ? a + n : invalid('ALL_ARGUMENTS_MUST_BE_NUMBERS'), 0)
		: null;
});

export function diff(a: number, b: number) {
	return _.some([a, b], _.isNil)
		? null
		: _.isNumber(a) && _.isNumber(b) ? b - a : invalid('INVALID_NUMBER_ARGUMENTS');
}

export const mult = variadic<number, number | null>((nums) => {
	return nums.length
		? _.reduce(nums, (a, n) => _.isNumber(n) ? n * a : invalid('ALL_ARGUMENTS_MUST_BE_NUMBERS'), 1)
		: null;
});

export function div(a: number, b: number) {
	return _.some([a, b], _.isNil)
		? null
		: _.isNumber(a) && _.isNumber(b)
			? b === 0
				? invalid('DIVISION_BY_ZERO')
				: a / b
			: invalid('INVALID_NUMBER_ARGUMENTS');
}

export function pow(n: number, exp: number) {
	return _.some([n, exp], _.isNil)
		? null
		: _.isNumber(n) && _.isNumber(exp)
			? n ** exp
			: invalid('INVALID_NUMBER_ARGUMENTS');
}

export function inc(n: number) {
	return _.isNil(n) ? null : _.isNumber(n) ? n + 1 : invalid('INVALID_NUMBER_ARGUMENT');
}

export function dec(n: number) {
	return _.isNil(n) ? null : _.isNumber(n) ? n - 1 : invalid('INVALID_NUMBER_ARGUMENT');
}

export function neg(n: number) {
	return _.isNil(n) ? null : _.isNumber(n) ? -n : invalid('INVALID_NUMBER_ARGUMENT');
}

export function inv(n: number) {
	return _.isNil(n) ? null : _.isNumber(n) ? 1 / n : invalid('INVALID_NUMBER_ARGUMENT');
}

export function mod(a: number, b: number) {
	return _.some([a, b], _.isNil)
		? null
		: _.isNumber(a) && _.isNumber(b)
			? a % b
			: invalid('INVALID_NUMBER_ARGUMENTS');
}

export function trunc(n: number) {
	return _.isNil(n) ? null : _.isNumber(n) ? Math.trunc(n) : invalid('INVALID_NUMBER_ARGUMENT');
}

export function ceil(n: number) {
	return _.isNil(n) ? null : _.isNumber(n) ? Math.ceil(n) : invalid('INVALID_NUMBER_ARGUMENT');
}

export function round(n: number) {
	return _.isNil(n) ? null : _.isNumber(n) ? Math.round(n) : invalid('INVALID_NUMBER_ARGUMENT');
}

// Special math transformers
export function sin(n: number) {
	return _.isNil(n) ? null : _.isNumber(n) ? Math.sin(n) : invalid('INVALID_NUMBER_ARGUMENT');
}

export function cos(n: number) {
	return _.isNil(n) ? null : _.isNumber(n) ? Math.cos(n) : invalid('INVALID_NUMBER_ARGUMENT');
}

export function sqrt(n: number) {
	return _.isNil(n) ? null : _.isNumber(n) ? Math.sqrt(n) : invalid('INVALID_NUMBER_ARGUMENT');
}

export function log(a: number, b: number) {
	return _.some([a, b], _.isNil)
		? null
		: _.isNumber(a) && _.isNumber(b)
			? Math.log(a) / Math.log(b)
			: invalid('INVALID_NUMBER_ARGUMENTS');
}

export function ln(n: number) {
	return _.isNil(n) ? null : _.isNumber(n) ? Math.log(n) : invalid('INVALID_NUMBER_ARGUMENT');
}

export function lg(n: number) {
	return _.isNil(n) ? null : _.isNumber(n) ? Math.log10(n) : invalid('INVALID_NUMBER_ARGUMENT');
}

export function deg(rads: number) {
	return _.isNil(rads) ? null : _.isNumber(rads) ? rads * (180 / Math.PI) : invalid('INVALID_NUMBER_ARGUMENT');
}

export function rad(degs: number) {
	return _.isNil(degs) ? null : _.isNumber(degs) ? degs * (Math.PI / 180) : invalid('INVALID_NUMBER_ARGUMENT');
}

// Statistics transformers
export const max = variadic<number, number | null>((nums) => {
	return nums.length ? _.maxBy(nums, n => _.isNumber(n) ? n : invalid('INVALID_NUMBER_ARGUMENT'))! : null;
});

export const min = variadic<number, number | null>((nums) => {
	return nums.length ? _.minBy(nums, n => _.isNumber(n) ? n : invalid('INVALID_NUMBER_ARGUMENT'))! : null;
});

export const avg = variadic<number, number | null>((nums) => {
	return nums.length ? _.meanBy(nums, n => _.isNumber(n) ? n : invalid('INVALID_NUMBER_ARGUMENT')) : null;
});

export const med = variadic<number, number | null>((nums) => {
	if (!nums.length) return null;
	if (!_.every(nums, _.isNumber)) return invalid('INVALID_NUMBER_ARGUMENT');

	const sorted = _.sortBy(nums);
	const middle = Math.floor(sorted.length / 2);

	return sorted.length % 2
		? sorted[middle]!
		: (sorted[middle - 1]! + sorted[middle]!) / 2;
});

export const sum = variadic<number, number | null>((nums) => {
	return nums.length ? _.sumBy(nums, n => _.isNumber(n) ? n : invalid('INVALID_NUMBER_ARGUMENT')) : null;
});

export const sumsq = variadic<number, number | null>((nums) => {
	return nums.length ? _.sumBy(nums, n => _.isNumber(n) ? n ** 2 : invalid('INVALID_NUMBER_ARGUMENT')) : null;
});

export const sumProduct = variadic<number[], number>((lists) => {
	if (!lists.every(_.isArray)) return invalid('LISTS_MUST_BE_ARRAYS');
	if (lists.length < 2) return invalid('MIN_TWO_LISTS_REQUIRED');

	lists.every((list, idx) => {
		if (!list.length) return invalid('NON_EMPTY_LISTS_REQUIRED');
		if (idx > 0 && list.length !== lists[0]!.length) return invalid('LISTS_MUST_BE_SAME_LENGTH');
		if (!_.every(list, _.isNumber)) return invalid('ALL_LIST_ITEMS_MUST_BE_NUMBERS');
		return true;
	});

	return _.sum(_.zipWith(...lists, (...values) => values.reduce((prod, num) => prod * num, 1)));
});

// List and string transformers
export function len(str: string): number;
export function len<T>(list: T[]): number;
export function len<T>(input: string | T[]): number {
	return _.isArray(input) ?? _.isString(input) ? input.length : 0;
}

export function left(str: string, length: number): string;
export function left<T>(list: T[], length: number): T[];
export function left<T>(input: string | T[], length: number): string | T[] {
	if (_.isString(input)) return input.substring(0, length);
	if (_.isArray(input)) return input.slice(0, length);
	return input;
}

export function right(str: string, length: number): string;
export function right<T>(list: T[], length: number): T[];
export function right<T>(input: string | T[], length: number): string | T[] {
	const len = _.isNumber(length) ? length : 0;
	return _.isString(input)
		? input.substring(Math.max(0, input.length - len))
		: _.isArray(input)
			? input.slice(-len)
			: input;
}

export function indexOf(str: string, search: string): number;
export function indexOf<T>(list: T[], value: T): number;
export function indexOf<T>(iterable: string | T[], value: string | T): number {
	return _.isString(iterable) && _.isString(value)
		? iterable.indexOf(value)
		: _.isArray(iterable)
			? _.findIndex(iterable, it => _.isEqual(it, value))
			: -1;
}

export function shuffle(str: string): string;
export function shuffle<T>(list: T[]): T[];
export function shuffle<T>(iterable: string | T[]): string | T[] {
	return _.isString(iterable)
		? _.shuffle(iterable).join()
		: _.isArray(iterable)
			? _.shuffle(iterable)
			: iterable;
}

// List transformers
export function lookup<T>(list: T[], value: T): TNullable<T> {
	if (!_.isArray(list)) return null;

	for (const item of list) {
		if (_.isEqual(item, value)) return item;
	}

	return null;
}

export function repeat<T>(quantity: number, sample: T): T[] {
	if (!_.isNumber(quantity)) return [];
	return Array.from<T>({ length: quantity < 0 ? 0 : quantity }).fill(sample);
}

// String transformers
export function substr(str: string, start: number, end?: number): string {
	if (!_.isString(str) || !_.isNumber(start) || (!_.isNil(end) && !_.isNumber(end))) return '';
	return str.substring(start, end);
}

// Collection transformers
export function filterBy(collection: TCollection[], prop: string, value: any): TCollection {
	return isCollection(collection) ? _.filter(collection, it => _.isEqual(it[prop], value)) : [];
}

export const concat = _.concat;
export const every = _.every;
export const find = _.find;
export const intersect = _.intersection;
export const keys = _.keys;
export const merge = _.merge;
export const omit = _.omit;
export const padLeft = _.padStart;
export const padRight = _.padEnd;
export const pick = _.pick;
export const sample = _.sample;
export const setAttr = _.set;
export const unsetAttr = _.unset;
export const values = _.values;
export const zip = _.zip;
