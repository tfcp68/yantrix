import { every, isArray, isEqual, isNull, isNumber, isObject, isString, some, values } from 'lodash-es';
import { variadic } from './utils';

// Logical predicates
export const and = variadic((conditions: boolean[]): boolean => every(conditions, Boolean));
export const all = and;

export const or = variadic((conditions: boolean[]): boolean => some(conditions, Boolean));
export const any = or;

export const not = (condition: boolean): boolean => !condition;
export const none = variadic((conditions: boolean[]): boolean => not(and(conditions)));

// Numeric predicates
export function isEven(n: number): boolean | null {
	return isNumber(n) ? n % 2 === 0 : null;
}

export function isOdd(n: number): boolean | null {
	return isNumber(n) ? Math.abs(n % 2) === 1 : null;
}

export function isInteger(value: number): boolean | null {
	if (!isNumber(value)) return null;
	return Number.isInteger(value);
}

export function isGreater(a: number, b: number): boolean | null {
	if (!isNumber(a) || !isNumber(b)) return null;
	return a > b;
}

export function isGreaterOrEqual(a: number, b: number): boolean | null {
	if (!isNumber(a) || !isNumber(b)) return null;
	return a >= b;
}

export function isLess(a: number, b: number): boolean | null {
	if (!isNumber(a) || !isNumber(b)) return null;
	return a < b;
}

export function isLessOrEqual(a: number, b: number): boolean | null {
	if (!isNumber(a) || !isNumber(b)) return null;
	return a <= b;
}

export function isNegative(value: number): boolean | null {
	if (!isNumber(value)) return null;
	return value < 0;
}

export function isPositive(value: number): boolean | null {
	if (!isNumber(value)) return null;
	return value >= 0;
}

// Lookup predicates
export function contains(str: string, substr: string): boolean | null;
export function contains<T extends object>(obj: T, value: T[keyof T]): boolean | null;
export function contains<T, V>(list: ArrayLike<T>, value: V): boolean | null;
export function contains(container: string | object | any[], value: any): boolean | null {
	if (isString(container) && isString(value)) return container.includes(value);
	if (isArray(container)) return some(container, item => isEqual(item, value));
	if (isObject(container) && !isNull(container)) return values(container).some(item => isEqual(item, value));
	return null;
}

export function has<T>(list: T[], index: number): boolean | null;
export function has<T extends object>(obj: T, key: keyof T): boolean | null;
export function has(container: any[] | object, keyOrIndex: number | keyof any): boolean | null {
	if (isArray(container) && isNumber(keyOrIndex)) return !!container[keyOrIndex];
	if (isObject(container) && !isNull(container) && isString(keyOrIndex)) return keyOrIndex in container;
	return null;
}

export { isEqual, isNull };
