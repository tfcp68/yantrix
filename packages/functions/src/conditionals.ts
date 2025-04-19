import { find, isArray, isBoolean, isNil } from 'lodash-es';
import { TCasePair, TNestedArray } from './types/common';
import { variadic } from './utils/utils';

/**
 * Evaluates a condition and returns one of two values based on the result.
 *
 * @template T - The type of the values to return.
 *
 * @param condition - The condition to evaluate.
 * @param true_value - The value to return if the condition is true.
 * @param false_value - The value to return if the condition is false.
 * @returns The true_value if the condition is true, otherwise the false_value.
 */
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

/**
 * Evaluates a series of conditions and returns the corresponding value for the first true condition.
 *
 * @template T - The type of the return value if the condition is true.
 * @template A - The type of the return value if the condition is false.
 * @param condition - The condition that needs to be checked.
 * @param expression - The return value if the condition is true.
 * @param alt - The return value if the condition is false.
 * @returns The return value if the condition is true, otherwise the alternative value.
 */
function _case<T, A = T>(condition: boolean, expression: T, alt?: A): T | A | null;

/**
 * Evaluates a series of conditions and returns the corresponding value for the first true condition.
 *
 * @template T - The type of the return value if the condition is true.
 * @template A - The type of the return value if the condition is false.
 * @param condition - The condition for the first case.
 * @param expression - The return value for the first case if the condition is true.
 * @param rest - Additional conditions and return values.
 * @returns The return value of the first true condition, or the return value of the last case if no conditions are true.
 */
function _case<T, A = T>(condition: boolean, expression: T, ...rest: any[]): T | A | null;

/**
 * Evaluates a series of conditions and returns the corresponding value for the first true condition.
 *
 * @template T - The type of the return value if the condition is true.
 * @template A - The type of the return value if the condition is false.
 * @param pair - A tuple containing a condition and a return value.
 * @param alt - The return value if no conditions are true.
 * @returns The return value of the first true condition, or the return value of the last case if no conditions are true.
 */
function _case<T, A = T>(pair: TCasePair<T>, alt?: A): T | A | null;

/**
 * Evaluates a series of conditions and returns the corresponding value for the first true condition.
 *
 * @template T - The type of the return value if the condition is true.
 * @template A - The type of the return value if the condition is false.
 * @param pairs - An array of tuples where each tuple contains a condition and a return value.
 * @param alt - The return value if no conditions are true.
 * @returns The return value of the first true condition, or the return value of the last case if no conditions are true.
 */
function _case<T, A = T>(pairs: TCasePair<T>[], alt?: A): T | A | null;

/**
 * Evaluates a series of conditions and returns the corresponding value for the first true condition.
 *
 * @template T - The type of the return value if the condition is true.
 * @template A - The type of the return value if the condition is false.
 * @param pairs - A nested array of tuples where each tuple contains a condition and a return value.
 * @param alt - The return value if no conditions are true.
 * @returns The return value of the first true condition, or the return value of the last case if no conditions are true.
 */
function _case<T, A = T>(pairs: TNestedArray<TCasePair<T>>, alt?: A): T | A | null;

/**
 * Evaluates a series of conditions and returns the corresponding value for the first true condition.
 *
 * @template T - The type of the return value if the condition is true.
 * @template A - The type of the return value if the condition is false.
 * @param pairsAndAlt - A nested array of tuples where each tuple contains a condition and a return value, followed by an optional alternative value.
 * @returns The return value of the first true condition, or the return value of the last case if no conditions are true.
 */
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

/**
 * Returns the first non-null expression from the provided list of expressions.
 *
 * @template T - The type of the expressions.
 * @param values - An array of expressions to evaluate.
 * @returns The first non-null expression, or null if all expressions are null.
 */
const coalesce = variadic(<T>(values: (T | null | undefined)[]): T | null => {
	return find(values, value => !isNil(value)) ?? null;
});

function choose(index: number, ...options: any[]): any {
	return options[index];
}

export {
	_case as case,
	choose,
	coalesce,
	_if as if,
};
