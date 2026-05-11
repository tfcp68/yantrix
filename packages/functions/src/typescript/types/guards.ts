import { TCollection } from './common';

export function isCollection(value: unknown): value is TCollection {
	return Array.isArray(value) && (value as unknown[]).every(
		it => it != null && (typeof it === 'object' || typeof it === 'function'),
	);
}

export function isIterable<T>(obj: unknown): obj is Iterable<T> {
	return obj != null && typeof (obj as any)[Symbol.iterator] === 'function';
}
