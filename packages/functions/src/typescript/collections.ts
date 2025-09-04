import { TNullable } from '@yantrix/utils';
import * as _ from 'lodash-es';
import { TCollection } from './types/common';
import { isCollection, isIterable } from './types/guards';

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
	return isIterable(iterable) ? iterable.length : 0;
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
	if (!_.isArray(list)) return null;

	for (const item of list) {
		if (_.isEqual(item, value)) return item;
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
	if (!_.isString(str) || !Number.isFinite(start) || (!_.isNil(end) && !Number.isFinite(end))) return '';
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
	return isCollection(collection) ? _.map(collection, item => item[prop]) : [];
}

// ┌───────────────────────────────────────────────────────────────────────────┐
// │                              Lodash Re-exports                            │
// └───────────────────────────────────────────────────────────────────────────┘

export const left = _.take;
export const right = _.takeRight;
export const reverse = _.reverse;
export const indexOf = _.indexOf;
export const repeat = _.repeat;
export const filterBy = _.filter;
export const sort = _.sortBy;
export const shuffle = _.shuffle;
export const concat = _.concat;
export const find = _.find;
export const every = _.every;
export const intersect = _.intersection;
export const keys = _.keys;
export const merge = _.merge;
export const omit = _.omit;
export const padRight = _.padEnd;
export const padLeft = _.padStart;
export const pick = _.pick;
export const sample = _.sample;
export const setAttr = _.set;
export const unsetAttr = _.unset;
export const values = _.values;
export const zip = _.zip;
