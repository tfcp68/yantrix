import { every, isArray, isNull, isObject } from 'lodash-es';
import { TCollection } from './common';

export function isCollection(value: unknown): value is TCollection {
	return isArray(value) && every(value, it => isObject(it) && !isNull(it));
}
