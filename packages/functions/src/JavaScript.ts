/** Wrapper function, ensures that the underlying functions will work with either a single array, or all its members as arguments. */
function _wrapper<T extends number | boolean | unknown>(callback: (nums: T[]) => T) {
	return (...nums: T[]) => {
		if (nums.length === 1 && Array.isArray(nums[0])) {
			return callback(nums[0]);
		} else {
			return callback(nums as T[]);
		}
	};
}

/**
 * Evaluates a condition and returns one of two values based on the result.
 *
 * @param condition - The condition to evaluate.
 * @param true_value - The value to return if the condition is true.
 * @param false_value - The value to return if the condition is false.
 * @returns The true_value if the condition is true, otherwise the false_value.
 */
function _if(condition: boolean, true_value: unknown, false_value: unknown): unknown {
	return condition === true ? true_value : false_value;
}

/**
 * Evaluates a series of conditions and returns the corresponding value for the first true condition.
 *
 * @param first_case_condition - The condition for the first case.
 * @param first_case_return_value - The return value for the first case if the condition is true.
 * @param other_cases - An array of tuples where each tuple contains a condition and a return value.
 * @returns The return value of the first true condition, or the return value of the last case if no conditions are true.
 */
function _case(first_case_condition: boolean,	first_case_return_value: unknown,	other_cases: Array<[condition: boolean, return_value: unknown]>): unknown {
	if (first_case_condition) {
		return first_case_return_value;
	}
	for (const [condition, return_value] of other_cases) {
		if (condition)
			return return_value;
	}
	return (other_cases[other_cases.length - 1] ?? [])[1];
}

/**
 * Returns the first non-null expression from the provided list of expressions.
 *
 * @param expressions - An array of expressions to evaluate.
 * @returns The first non-null expression, or null if all expressions are null.
 */
const _coalesce = _wrapper((expressions: unknown[]): unknown => {
	return expressions.find((exp: unknown) => exp !== null) ?? null;
});

/**
 * Generates a random number.
 *
 * @param min - The minimum value (inclusive) for the random number. If not provided, defaults to 0 or 1.
 * @param max - The maximum value (exclusive) for the random number. If not provided, defaults to 0 or 1.
 * @returns A random number between min and max, or 0 or 1 if min and max are not provided.
 */
function _random(min?: number, max?: number): number {
	if (min && max) {
		return Math.floor(Math.random() * (max - min) + min);
	} else {
		return Math.random() > 0.5 ? 1 : 0;
	}
}

/**
 * Functions that execute conditional logic.
 */
export const Conditionals = {
	if: _if,
	case: _case,
	/**
	 * Returns the first non-null expression from the provided list of expressions.
	 *
	 * @param expressions - An array of expressions to evaluate.
	 * @returns The first non-null expression, or null if all expressions are null.
	 */
	coalesce: _coalesce,
	random: _random,
};

// ==================

// Built-Ins: Binary Predicates

/**
 * Evaluates a series of conditions and returns true if all conditions are true.
 *
 * @param conditions - An array of boolean conditions to evaluate.
 * @returns True if all conditions are true, otherwise false.
 */
const and = _wrapper((conditions: boolean[]): boolean => {
	return conditions.find(cond => cond === false) ?? true;
});

/**
 * Evaluates a series of conditions and returns true if at least one condition is true.
 *
 * @param conditions - An array of boolean conditions to evaluate.
 * @returns True if at least one condition is true, otherwise false.
 */
const or = _wrapper((conditions: boolean[]): boolean => {
	return conditions.find(cond => cond === true) ?? false;
});

/**
 * Negates the provided condition.
 *
 * @param condition - The condition to negate.
 * @returns The negated condition.
 */
function not(condition: boolean): boolean {
	return !condition;
}

/**
 * Evaluates a series of conditions and returns true if none of the conditions are true.
 *
 * @param conditions - An array of boolean conditions to evaluate.
 * @returns True if none of the conditions are true, otherwise false.
 */
const none = _wrapper((conditions: boolean[]): boolean => {
	return !(conditions.find(cond => cond === false) ?? true);
});

/**
 * Functions that perform binary logic.
 */
export const BinaryPredicates = {
	/**
	 * Evaluates a series of conditions and returns true if all conditions are true.
	 *
	 * @param conditions - An array of boolean conditions to evaluate.
	 * @returns True if all conditions are true, otherwise false.
	 */
	and,
	/**
	 * Evaluates a series of conditions and returns true if all conditions are true.
	 *
	 * @param conditions - An array of boolean conditions to evaluate.
	 * @returns True if all conditions are true, otherwise false.
	 */
	all: and,
	/**
	 * Evaluates a series of conditions and returns true if at least one condition is true.
	 *
	 * @param conditions - An array of boolean conditions to evaluate.
	 * @returns True if at least one condition is true, otherwise false.
	 */
	or,
	/**
	 * Evaluates a series of conditions and returns true if at least one condition is true.
	 *
	 * @param conditions - An array of boolean conditions to evaluate.
	 * @returns True if at least one condition is true, otherwise false.
	 */
	any: or,
	not,
	/**
	 * Evaluates a series of conditions and returns true if none of the conditions are true.
	 *
	 * @param conditions - An array of boolean conditions to evaluate.
	 * @returns True if none of the conditions are true, otherwise false.
	 */
	none,
};

// ==================

// Built-Ins: Numeric Predicates

/**
 * Checks if a number is even.
 *
 * @returns True if the number is even, otherwise false.
 */
function isEven(num: number): boolean {
	return num % 2 === 0;
}

/**
 * Checks if a number is odd.
 *
 * @returns True if the number is odd, otherwise false.
 */
function isOdd(num: number): boolean {
	return num % 2 !== 0;
}

/**
 * Checks if a number is an integer.
 *
 * @returns True if the number is an integer, otherwise false.
 */
function isInteger(num: number): boolean {
	return Number.isInteger(num);
}

/**
 * Checks if two values are equal.
 *
 * @returns True if the values are equal, otherwise false.
 */
function isEqual(x: unknown, y: unknown): boolean {
	return typeof x === typeof y && x === y;
}

/**
 * Checks if the first number is greater than the second number.
 *
 * @returns True if the first number is greater, otherwise false.
 */
function isGreater(x: number, y: number): boolean {
	return x > y;
}

/**
 * Checks if the first number is greater than or equal to the second number.
 *
 * @returns True if the first number is greater than or equal, otherwise false.
 */
function isGreaterOrEqual(x: number, y: number): boolean {
	return x >= y;
}

/**
 * Checks if the first number is less than the second number.
 *
 * @returns True if the first number is less, otherwise false.
 */
function isLess(x: number, y: number): boolean {
	return x < y;
}

/**
 * Checks if the first number is less than or equal to the second number.
 *
 * @returns True if the first number is less than or equal, otherwise false.
 */
function isLessOrEqual(x: number, y: number): boolean {
	return x <= y;
}

/**
 * Checks if a number is negative.
 *
 * @returns True if the number is negative, otherwise false.
 */
function isNegative(x: number): boolean {
	return x < 0;
}

/**
 * Checks if a number is positive.
 *
 * @returns True if the number is positive, otherwise false.
 */
function isPositive(x: number): boolean {
	return x > 0;
}

/**
 * Functions that compare numerical values and return either 'true' or 'false'.
 */
export const NumericPredicates = {
	isEven,
	isOdd,
	isInteger,
	isEqual,
	isGreater,
	isGreaterOrEqual,
	isLess,
	isLessOrEqual,
	isNegative,
	isPositive,
};

// ==================

// Built-Ins: Lookup Predicates

/**
 * Checks if a string, object, or array contains a specified value.
 *
 * @param a - The string, object, or array to check.
 * @param b - The value to check for.
 * @returns True if the value is found, otherwise false.
 */
function contains(a: unknown, b: unknown): boolean {
	if (typeof a === 'string' && typeof b === 'string') {
		return a.includes(b);
	} else if (typeof a === 'object' && typeof b === 'string') {
		return Object.values(a as object).includes(b);
	} else if (Array.isArray(a)) {
		return a.includes(b);
	}
	return false;
}

/**
 * Checks if an object or array has a specified key or index.
 *
 * @param a - The object or array to check.
 * @param b - The key or index to check for.
 * @returns True if the key or index is found, otherwise false.
 */
function has(a: unknown, b: unknown): boolean {
	if (typeof a === 'object' && a != null && typeof b === 'string') {
		return b in a;
	} else if (Array.isArray(a) && typeof b === 'number') {
		return a[b] !== undefined;
	}
	return false;
}

/**
 * Checks if an expression is null or undefined.
 *
 * @param exp - The expression to check.
 * @returns True if the expression is null or undefined, otherwise false.
 */
function isNull(exp: object): boolean {
	return exp == null;
}

/**
 * Functions that check for the presence of values in strings, objects, and arrays, and return either 'true' or 'false'.
 */
export const LookupPredicates = {
	contains,
	has,
	isNull,
};

// ==================

// Built-Ins: Arithmetics
/**
 * Adds a list of numbers together.
 *
 * @param nums - An array of numbers.
 * @returns The sum of the numbers.
 */
const add = _wrapper((nums: number[]): number => {
	const initialValue = 0;
	return nums.reduce((accumulator, currentValue) => accumulator + currentValue, initialValue);
});

/**
 * Subtracts the second number from the first number.
 */
function diff(num1: number, num2: number): number {
	return num1 - num2;
}

/**
 * Multiplies a list of numbers.
 *
 * @param nums - An array of numbers to multiply.
 * @returns The product of the numbers.
 */
const mult = _wrapper((nums: number[]): number => {
	const initialValue = 1;
	return nums.reduce((accumulator, currentValue) => accumulator * currentValue, initialValue);
});

/**
 * Divides the first number by the second number.
 */
function div(num1: number, num2: number): number {
	return num1 / num2;
}

/**
 * Raises the first number to the power of the second number.
 *
 * @param num1 - The base number.
 * @param num2 - The exponent.
 * @returns The result of raising the base to the exponent.
 */
function pow(num1: number, num2: number): number {
	return num1 ** num2;
}

/**
 * Increments a number by 1.
 */
function inc(num: number): number {
	return num + 1;
}

/**
 * Decrements a number by 1.
 */
function dec(num: number): number {
	return num - 1;
}

/**
 * Negates a number.
 */
function neg(num: number): number {
	return num * -1;
}

/**
 * Inverts a number.
 */
function inv(num: number): number {
	return 1 / num;
}

/**
 * Calculates the modulus of two numbers.
 *
 * @returns The remainder of the modulus division of the two numbers.
 */
function mod(num1: number, num2: number): number {
	return num1 % num2;
}

/**
 * Truncates a number to its integer part.
 *
 * @param num - The number to truncate.
 * @returns The integer part of the number.
 */
function trunc(num: number): number {
	return Math.floor(num);
}

/**
 * Rounds a number up to the nearest integer.
 *
 * @param num - The number to round up.
 * @returns The smallest integer greater than or equal to the number.
 */
function ceil(num: number): number {
	return Math.ceil(num);
}

/**
 * Rounds a number to the nearest integer.
 *
 * @param num - The number to round.
 * @returns The nearest integer to the number.
 */
function round(num: number): number {
	return Math.round(num);
}

/**
 * Functions that perform arithmetic operations on numerical values.
 */
export const Arithmetics = {
	/**
	 * Adds a list of numbers together.
	 *
	 * @param nums - An array of numbers.
	 * @returns The sum of the numbers.
	 */
	add,
	diff,
	/**
	 * Multiplies a list of numbers.
	 *
	 * @param nums - An array of numbers to multiply.
	 * @returns The product of the numbers.
	 */
	mult,
	div,
	pow,
	inc,
	dec,
	neg,
	inv,
	mod,
	trunc,
	ceil,
	round,
};

// ==================

// Built-Ins: Special Maths
/**
 * Calculates the sine of a number.
 */
function sin(num: number): number {
	return Math.sin(num);
}

/**
 * Calculates the cosine of a number.
 */
function cos(num: number): number {
	return Math.cos(num);
}

/**
 * Calculates the square root of a number.
 */
function sqrt(num: number): number {
	return Math.sqrt(num);
}

/**
 * Calculates the logarithm of a number with a specified base.
 *
 * @param num - The number to calculate the logarithm of.
 * @param base - The base of the logarithm.
 * @returns The logarithm of the number with the specified base.
 */
function log(num: number, base: number): number {
	return Math.log(num) / Math.log(base);
}

/**
 * Calculates the natural logarithm (base e) of a number.
 */
function ln(num: number): number {
	return Math.log(num);
}

/**
 * Calculates the base-10 logarithm of a number.
 */
function lg(num: number): number {
	return Math.log10(num);
}

/**
 * Converts a number from radians to degrees.
 */
function deg(num: number): number {
	return num * 57.3;
}

/**
 * Converts a number from degrees to radians.
 */
function rad(num: number): number {
	return num / 57.3;
}

/**
 * Functions that perform special mathematical operations on numerical values.
 */
export const SpecialMaths = { sin, cos, sqrt, log, ln, lg, deg, rad };

// ==================

// Built-Ins: Statistics

const max = _wrapper((nums: number[]): number => {
	return Math.max(...nums);
});

const min = _wrapper((nums: number[]): number => {
	return Math.min(...nums);
});

const avg = _wrapper((nums: number[]): number => {
	return nums.reduce((accumulator, currentValue) => accumulator + currentValue, 0) / nums.length;
});

const med = _wrapper((nums: number[]): number => {
	nums.sort((a, b) => a - b);
	const mid = Math.floor(nums.length / 2);
	return nums.length % 2 === 0 ? (nums[mid] ?? 0) : ((nums[mid - 1] ?? 0) + (nums[mid] ?? 0)) / 2;
});

const sum = _wrapper((nums: number[]): number => {
	return nums.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
});

const sumsq = _wrapper((nums: number[]): number => {
	return nums.reduce((accumulator, currentValue) => accumulator + (currentValue ** 2), 0);
});

const sumProduct = (...nums_lists: number[][]): number => {
	return nums_lists
		.map(list => list.reduce((accumulator, currentValue) => accumulator * currentValue, 1))
		.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
};

/**
 * Functions that run statistical operations on arrays.
 */
export const Statistics = {
	/**
	 * Returns the maximum value from a list of numbers.
	 *
	 * @param nums - An array of numbers to evaluate.
	 * @returns The maximum value found in the array.
	 */
	max,
	/**
	 * Returns the minimum value from a list of numbers.
	 *
	 * @param nums - An array of numbers to evaluate.
	 * @returns The minimum value found in the array.
	 */
	min,
	/**
	 * Returns the average value from a list of numbers.
	 *
	 * @param nums - An array of numbers to evaluate.
	 * @returns The average of all values of the array.
	 */
	avg,
	/**
	 * Returns the median value from a list of numbers.
	 *
	 * @param nums - An array of numbers to evaluate.
	 * @returns The median value of the array.
	 */
	med,
	/**
	 * Returns the sum of a list of numbers.
	 *
	 * @param nums - An array of numbers to evaluate.
	 * @returns The sum of the numbers in the array.
	 */
	sum,
	/**
	 * Returns the sum of the squares of a list of numbers.
	 *
	 * @param nums - An array of numbers to evaluate.
	 * @returns The sum of the squares of the numbers in the array.
	 */
	sumsq,
	/**
	 * Returns the sum of the products of corresponding numbers in multiple lists.
	 *
	 * @param nums_lists - Multiple arrays of numbers to evaluate.
	 * @returns The sum of the products of corresponding numbers.
	 */
	sumProduct,
};

// ==================

// Built-Ins: List Transformers

/**
 * Returns the length of a list.
 */
function len(list: unknown[]): number {
	return list.length;
}

/**
 * Looks up a value in a list and returns it if found.
 *
 * @param list - The list to search.
 * @param value - The value to look for.
 * @returns The value if found, otherwise null.
 */
function lookup(list: unknown[], value: unknown): unknown {
	return list.includes(value) ? value : null;
}

/**
 * Filters a list of objects by a specified property and value.
 *
 * @param list - The list of objects to filter.
 * @param property_name - The property name to filter by.
 * @param value - The value to filter by.
 * @returns A list of objects that match the specified property and value.
 */
function filterBy(list: object[], property_name: string, value: unknown): object[] {
	return list.filter(obj => property_name in obj && obj[property_name as keyof typeof obj] === value);
}

/**
 * Finds the first object in a list that matches a specified property and value.
 *
 * @param list - The list of objects to search.
 * @param property_name - The property name to search by.
 * @param value - The value to search for.
 * @returns The first object that matches the specified property and value, or null if not found.
 */
function find(list: object[], property_name: string, value: unknown): unknown {
	return (
		list.filter(
			obj => property_name in obj && obj[property_name as keyof typeof obj] === value,
		)[0] ?? null
	);
}

/**
 * Returns the leftmost elements of a list up to a specified length.
 *
 * @param list - The list to evaluate.
 * @param len - The number of elements to return.
 * @returns A list containing the leftmost elements up to the specified length.
 */
function left(list: unknown[], len: number): unknown[] {
	return list.slice(0, len);
}

/**
 * Returns the rightmost elements of a list up to a specified length.
 *
 * @param list - The list to evaluate.
 * @param len - The number of elements to return.
 * @returns A list containing the rightmost elements up to the specified length.
 */
function right(list: unknown[], len: number): unknown[] {
	return list.slice(-len);
}

/**
 * Returns the index of a value in a list.
 *
 * @param list - The list to search.
 * @param value - The value to look for.
 * @returns The index of the value in the list, or -1 if not found.
 */
function indexOf(list: unknown[], value: unknown): number {
	return list.indexOf(value);
}

/**
 * Functions that manipulate lists.
 */
export const ListTransformers = { len, lookup, filterBy, find, left, right, indexOf };

// ==================

// Built-Ins: String Transformers

/**
 * Returns a substring of a string.
 *
 * @param str - The string to extract the substring from.
 * @param start - The starting index of the substring.
 * @param end - The ending index of the substring (optional).
 * @returns The extracted substring.
 */
function substr(str: string, start: number, end?: number): string {
	return str.substring(start, end);
}

/**
 * Returns the length of a string.
 *
 * @param str - The string to evaluate.
 * @returns The length of the string.
 */
function strlen(str: string): number {
	return str.length;
}

/**
 * Returns the leftmost characters of a string up to a specified length.
 *
 * @param str - The string to evaluate.
 * @param len - The number of characters to return.
 * @returns A substring containing the leftmost characters up to the specified length.
 */
function strLeft(str: string, len: number): string {
	return str.substring(0, len);
}

/**
 * Returns the rightmost characters of a string up to a specified length.
 *
 * @param str - The string to evaluate.
 * @param len - The number of characters to return.
 * @returns A substring containing the rightmost characters up to the specified length.
 */
function strRight(str: string, len: number): string {
	return str.substring(-len);
}

/**
 * Returns the index of a substring within a string.
 *
 * @param str - The string to search.
 * @param substr - The substring to look for.
 * @returns The index of the substring within the string, or -1 if not found.
 */
function strIndexOf(str: string, substr: string): number {
	return str.indexOf(substr);
}

/**
 * Functions that manipulate strings.
 */
export const StringTransformers = { substr, strlen, strLeft, strRight, strIndexOf };

// ==================

/** @hidden */
export const builtInFunctions = {
	...Conditionals,
	...BinaryPredicates,
	...NumericPredicates,
	...LookupPredicates,
	...Arithmetics,
	...SpecialMaths,
	...Statistics,
	...ListTransformers,
	...StringTransformers,
};
