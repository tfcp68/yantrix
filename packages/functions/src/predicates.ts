import { every, isArray, isEqual, isNull, isNumber, isObject, isString, some, values } from 'lodash-es';
import { variadic } from './utils';

// Logical predicates
export const and = variadic((conditions: boolean[]) => every(conditions, Boolean));
export const all = and;

export const or = variadic((conditions: boolean[]) => every(conditions, Boolean));
export const any = or;

export const not = (condition: boolean) => !condition;
export const none = variadic((conditions: boolean[]) => not(and(conditions)));

// Numeric predicates
export function isEven(n: number) {
	return isNumber(n) ? n % 2 === 0 : false;
}

export function isOdd(n: number) {
	return isNumber(n) ? Math.abs(n % 2) === 1 : false;
}

export function isInteger(value: number) {
	if (!isNumber(value)) return false;
	return Number.isInteger(value);
}

export function isGreater(a: number, b: number) {
	if (!isNumber(a) || !isNumber(b)) return false;
	return a > b;
}

export function isGreaterOrEqual(a: number, b: number): boolean {
	if (!isNumber(a) || !isNumber(b)) return false;
	return a >= b;
}

export function isLess(a: number, b: number): boolean {
	if (!isNumber(a) || !isNumber(b)) return false;
	return a < b;
}

export function isLessOrEqual(a: number, b: number): boolean {
	if (!isNumber(a) || !isNumber(b)) return false;
	return a <= b;
}

export function isNegative(value: number): boolean {
	if (!isNumber(value)) return false;
	return value < 0;
}

export function isPositive(value: number): boolean {
	if (!isNumber(value)) return false;
	return value >= 0;
}

// Lookup predicates
export function contains(str: string, substr: string): boolean;
export function contains<T extends object>(obj: T, value: T[keyof T]): boolean;
export function contains<T, V>(list: ArrayLike<T>, value: V): boolean;
export function contains(container: string | object | any[], value: any): boolean {
	if (isString(container) && isString(value)) return container.includes(value);
	if (isArray(container)) return some(container, item => isEqual(item, value));
	if (isObject(container) && !isNull(container)) return values(container).some(item => isEqual(item, value));
	return false;
}

export function has<T>(list: T[], index: number): boolean;
export function has<T extends object>(obj: T, key: keyof T): boolean;
export function has(container: any[] | object, keyOrIndex: number | keyof any): boolean {
	if (isArray(container) && isNumber(keyOrIndex)) return !!container[keyOrIndex];
	if (isObject(container) && !isNull(container) && isString(keyOrIndex)) return keyOrIndex in container;
	return false;
}

export { isEqual, isNull };
