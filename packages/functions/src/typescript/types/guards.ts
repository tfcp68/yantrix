import { every, isArray, isNil, isNull, isObject } from 'lodash-es';
import { TCollection } from './common';

export function isCollection(value: unknown): value is TCollection {
	return isArray(value) && every(value, it => isObject(it) && !isNull(it));
}

export function isIterable<T>(obj: unknown): obj is Iterable<T> {
	return !isNil(obj) && typeof (obj as any)[Symbol.iterator] === 'function';
}
