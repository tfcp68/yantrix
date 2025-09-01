import { invalid } from './utils/errors';

/**
 * Evaluates a condition and returns the corresponding value.
 *
 * @template T - The type of the return value if the condition is true.
 * @param condition - The condition that needs to be checked.
 * @param trueValue - The return value if the condition is true. Defaults to the condition value if not provided.
 * @param falseValue - The return value if the condition is false. Defaults to null if not provided.
 * @returns The return value if the condition is true, otherwise the alternative value.
 */
function _if<T>(condition: any, trueValue?: T, falseValue?: T): T | null {
	return (condition ? trueValue ?? condition : falseValue ?? null);
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
const _case = <T = any>(...args: [...Array<boolean | T>, T]): T => {
	if (!args?.length || args.length % 2 === 0)
		return invalid('INVALID_ARGUMENTS');
	const defaultValue = args[args.length - 1] ?? null;
	// Validate argument structure at runtime
	for (let i = 0; i < args.length - 1; i++) {
		if (i % 2 === 0 && typeof args[i] !== 'boolean') {
			return invalid('INVALID_BINARY_ARGUMENT');
		}
		if (args[i] === true) {
			if (typeof args[i + 1] === 'undefined')
				return invalid('INDEX_OUT_OF_RANGE');
			return args[i + 1] as T;
		}
	}
	return defaultValue as T;
};

/**
 * Returns the first non-empty and non-null expression from the provided list of expressions.
 *
 * @template T - The type of the expressions, defaults to any.
 * @param values - A list of expressions to evaluate.
 * @returns The first non-null expression, or null if all expressions are null.
 */
const coalesce = <T = any>(...values: (T | null | undefined)[]): T | null => {
	if (!values?.length) return invalid('INVALID_ARGUMENTS');
	for (const value of values) {
		if (value !== null && value !== undefined) {
			return value;
		}
	}
	return null;
};

/**
 * Selects the element at the specified index from a list of options.
 * If the only argument after the index is an array, it flattens the array before selecting the element.
 *
 * @template T - The type of the elements in the options.
 *
 * @param index - The zero-based index of the element to select.
 * @param options - A list of options to choose from, one by one.
 * @returns The element at the specified index, or undefined if the index is out of bounds.
 *
 * @throws {Error} If no options are provided.
 * @throws {Error} If the index is out of bounds.
 *
 * @example
 * choose(1, 'a', 'b', 'c'); // Returns 'b'
 * choose(2, ['a', 'b', 'c', 'd']); // throws error
 * choose(0); // Throws error
 * choose(5, 'a', 'b', 'c'); // Throws error
 */
function choose<T>(index: number, ...options: T[]): T | undefined {
	if (options.length === 0) return invalid('INVALID_NUMBER_OF_ARGUMENTS');
	const flattenedOptions = [...(options || [])] as T[];
	if (index < 0 || index >= flattenedOptions.length) return invalid('INDEX_OUT_OF_RANGE');
	return flattenedOptions[index];
}

export {
	_case as case,
	choose,
	coalesce,
	_if as if,
};
