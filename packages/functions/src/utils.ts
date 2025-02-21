import { every, isArray, map } from 'lodash-es';
import { TNestedArray } from './types';

export function flatMapUntilLength<T>(array: TNestedArray<T>): TNestedArray<T> {
	if (!isArray(array)) return [array];
	if (!array.length) return [];

	if (array.length === 1) {
		if (isArray(array[0])) return flatMapUntilLength(array[0] as TNestedArray<T>);
		return array;
	}

	return array.length >= 2 && every(array, isArray) ? map(array, flatMapUntilLength) as TNestedArray<T> : array;
}

export function variadic<T, R = T>(fn: (conditions: T[]) => R) {
	return function (...args: TNestedArray<T>): R {
		const conditions = flatMapUntilLength(args);
		return fn(conditions as T[]);
	};
}
