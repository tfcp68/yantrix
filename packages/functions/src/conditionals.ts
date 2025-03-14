import { find, isArray, isBoolean, isNil, isNumber } from 'lodash-es';
import { TCasePair, TNestedArray } from './types/common';
import { variadic } from './utils/utils';

function _if<T>(condition: boolean, trueValue: T, falseValue: T): T {
	return (condition ? trueValue : falseValue);
}

function isValidPair<T = any>(pair: unknown): pair is TCasePair<T> {
	return isArray(pair) && pair.length === 2 && isBoolean(pair[0]);
}

function flattenPairs<T = any>(input: unknown): TCasePair<T>[] {
	if (!isArray(input)) return [];

	const result: TCasePair<T>[] = [];
	for (const item of input) {
		if (isValidPair(item)) {
			result.push(item);
		} else if (isArray(item)) {
			result.push(...flattenPairs(item));
		}
	}
	return result;
}

function _case<T, A = T>(condition: boolean, expression: T, alt?: A): T | A | null;
function _case<T, A = T>(condition: boolean, expression: T, ...rest: any[]): T | A | null;
function _case<T, A = T>(pair: TCasePair<T>, alt?: A): T | A | null;
function _case<T, A = T>(pairs: TCasePair<T>[], alt?: A): T | A | null;
function _case<T, A = T>(pairs: TNestedArray<TCasePair<T>>, alt?: A): T | A | null;
function _case<T, A = T>(...pairsAndAlt: [...TNestedArray<TCasePair<T>>[], A]): T | A | null;
function _case<T, A = T>(...args: unknown[]): T | A | null {
	if (args.length >= 2 && typeof args[0] === 'boolean') {
		if (args.length > 3 || (args.length === 3 && typeof args[2] === 'boolean')) {
			const pairs: TCasePair<T>[] = [];
			let alt: A | undefined;

			for (let i = 0; i < args.length - 1; i += 2) {
				if (typeof args[i] === 'boolean') {
					pairs.push([args[i] as boolean, args[i + 1] as T]);
				}
			}

			if (args.length % 2 === 1 && typeof args[args.length - 1] !== 'boolean') {
				alt = args[args.length - 1] as A;
			}

			const matchingPair = pairs.find(([condition]) => condition);
			return matchingPair ? matchingPair[1] : (alt ?? null);
		}

		const [condition, value, alt] = args as [boolean, T, A | undefined];
		return condition ? value : (alt ?? null);
	}

	if (args.length === 1) {
		const [firstArg] = args;

		if (isValidPair(firstArg)) {
			const [condition, value] = firstArg;
			return condition ? value : null;
		}

		if (isArray(firstArg)) {
			const pairs = flattenPairs(firstArg);
			const matchingPair = pairs.find(([condition]) => condition);
			return matchingPair ? matchingPair[1] : null;
		}
	}

	if (args.length === 2) {
		const [pairs, alt] = args;

		if (isValidPair(pairs)) {
			const [condition, value] = pairs;
			return condition ? value : (alt as A ?? null);
		}

		if (isArray(pairs)) {
			const flatPairs = flattenPairs(pairs);
			const matchingPair = flatPairs.find(([condition]) => condition);
			return matchingPair ? matchingPair[1] : (alt as A ?? null);
		}
	}

	return null;
}

const coalesce = variadic(<T>(values: (T | null | undefined)[]): T | null => {
	return find(values, value => !isNil(value)) ?? null;
});

function random(min?: number, max?: number): number {
	if (isNumber(min) && isNumber(max)) return Math.floor(Math.random() * (max - min) + min);
	else return Math.round(Math.random());
}

export {
	_case as case,
	coalesce,
	_if as if,
	random,
};
