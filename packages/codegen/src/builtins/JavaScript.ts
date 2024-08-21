// Built-Ins: Conditional expressions
const _if = (condition: boolean, true_value: unknown, false_value: unknown): unknown => {
	return condition === true ? true_value : false_value;
};

const _wrapper = <T extends number | boolean | unknown>(callback: (nums: T[]) => T) => {
	return (...nums: T[]) => {
		if (nums.length === 1 && Array.isArray(nums[0])) {
			return callback(nums[0]);
		} else {
			return callback(nums as T[]);
		}
	};
};

const _case = (
	first_case_condition: boolean,
	first_case_return_value: unknown,
	other_cases: Array<[condition: boolean, return_value: unknown]>,
): unknown => {
	if (first_case_condition) {
		return first_case_return_value;
	}
	for (const [condition, return_value] of other_cases) {
		if (condition) return return_value;
	}
	return (other_cases[other_cases.length - 1] ?? [])[1];
};

const _coalesce = _wrapper((expressions: unknown[]): unknown => {
	return expressions.find((exp: unknown) => exp !== null) ?? null;
});

const _random = (min?: number, max?: number): number => {
	if (min && max) {
		return Math.floor(Math.random() * (max - min) + min);
	} else {
		return Math.random() > 0.5 ? 1 : 0;
	}
};

export const Conditionals = {
	if: _if,
	case: _case,
	coalesce: _coalesce,
	random: _random,
};

// ==================

// Built-Ins: Binary Predicates

const and = _wrapper((conditions: boolean[]): boolean => {
	return conditions.find((cond) => cond === false) ?? true;
});
const or = _wrapper((conditions: boolean[]): boolean => {
	return conditions.find((cond) => cond === true) ?? false;
});
const not = (condition: boolean): boolean => {
	return !condition;
};
const none = _wrapper((conditions: boolean[]): boolean => {
	return !(conditions.find((cond) => cond === false) ?? true);
});

export const BinaryPredicates = {
	and,
	all: and,
	or,
	any: or,
	not,
	none,
};

// ==================

// Built-Ins: Numeric Predicates

const isEven = (num: number): boolean => {
	return num % 2 === 0;
};
const isOdd = (num: number): boolean => {
	return num % 2 !== 0;
};
const isInteger = (num: number): boolean => {
	return Number.isInteger(num);
};
const isEqual = (x: unknown, y: unknown): boolean => {
	return typeof x === typeof y && x === y;
};
const isGreater = (x: number, y: number): boolean => {
	return x > y;
};
const isGreaterOrEqual = (x: number, y: number): boolean => {
	return x >= y;
};
const isLess = (x: number, y: number): boolean => {
	return x < y;
};
const isLessOrEqual = (x: number, y: number): boolean => {
	return x <= y;
};
const isNegative = (x: number): boolean => {
	return x < 0;
};
const isPositive = (x: number): boolean => {
	return x > 0;
};

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

const contains = (a: unknown, b: unknown): boolean => {
	if (typeof a === 'string' && typeof b === 'string') {
		return a.includes(b);
	} else if (typeof a === 'object' && typeof b === 'string') {
		return Object.values(a as object).includes(b); // ?
	} else if (Array.isArray(a)) {
		return a.includes(b);
	}
	return false;
};

const has = (a: unknown, b: unknown): boolean => {
	if (typeof a === 'object' && a != null && typeof b === 'string') {
		return a.hasOwnProperty(b);
	} else if (Array.isArray(a) && typeof b === 'number') {
		return a[b] !== undefined;
	}
	return false;
};

// ??????
const isNull = (exp: object): boolean => {
	return exp == null;
};

export const LookupPredicates = {
	contains,
	has,
	isNull,
};

// ==================

// Built-Ins: Arithmetics
const add = _wrapper((nums: number[]): number => {
	const initialValue = 0;
	return nums.reduce((accumulator, currentValue) => accumulator + currentValue, initialValue);
});
const diff = (num1: number, num2: number): number => {
	return num1 - num2;
};
const mult = _wrapper((nums: number[]): number => {
	const initialValue = 1;
	return nums.reduce((accumulator, currentValue) => accumulator * currentValue, initialValue);
});

const div = (num1: number, num2: number): number => {
	return num1 / num2;
};
const pow = (num1: number, num2: number): number => {
	return num1 ^ num2;
};
const inc = (num: number): number => {
	return num + 1;
};
const dec = (num: number): number => {
	return num - 1;
};
const neg = (num: number): number => {
	return num * -1;
};
const inv = (num: number): number => {
	return 1 / num;
};
const mod = (num1: number, num2: number) => {
	return num1 % num2;
};
const trunc = (num: number): number => {
	return Math.floor(num);
};
const ceil = (num: number): number => {
	return Math.ceil(num);
};
const round = (num: number): number => {
	return Math.round(num);
};

export const Arithmetics = { add, diff, mult, div, pow, inc, dec, neg, inv, mod, trunc, ceil, round };

// ==================

// Built-Ins: Special Maths
const sin = (num: number): number => {
	return Math.sin(num);
};
const cos = (num: number): number => {
	return Math.cos(num);
};
const sqrt = (num: number): number => {
	return Math.sqrt(num);
};
const log = (num: number, base: number) => {
	return Math.log(num) / Math.log(base);
};
const ln = (num: number) => {
	return Math.log(num);
};
const lg = (num: number) => {
	return Math.log10(num);
};
const deg = (num: number) => {
	return num * 57.3;
};
const rad = (num: number) => {
	return num / 57.3;
};

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
	return nums.length % 2 == 0 ? (nums[mid] ?? 0) : ((nums[mid - 1] ?? 0) + (nums[mid] ?? 0)) / 2;
});

const sum = _wrapper((nums: number[]): number => {
	return nums.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
});

const sumsq = _wrapper((nums: number[]): number => {
	return nums.reduce((accumulator, currentValue) => accumulator + (currentValue ^ 2), 0);
});

const sumProduct = (...nums_lists: number[][]): number => {
	return nums_lists
		.map((list) => list.reduce((accumulator, currentValue) => accumulator * currentValue, 1))
		.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
};

export const Statistics = { max, min, avg, med, sum, sumsq, sumProduct };

// ==================

// Built-Ins: List Transformers

const len = (list: unknown[]) => {
	return list.length;
};

const lookup = (list: unknown[], value: unknown): unknown => {
	return list.includes(value) ? value : null;
};

const filterBy = (list: object[], property_name: string, value: unknown): object[] => {
	return list.filter((obj) => obj.hasOwnProperty(property_name) && obj[property_name as keyof typeof obj] === value);
};

const find = (list: object[], property_name: string, value: unknown): unknown => {
	return (
		list.filter(
			(obj) => obj.hasOwnProperty(property_name) && obj[property_name as keyof typeof obj] === value,
		)[0] ?? null
	);
};

const left = (list: unknown[], len: number) => {
	return list.slice(0, len);
};

const right = (list: unknown[], len: number) => {
	return list.slice(-len);
};

const indexOf = (list: unknown[], value: unknown): number => {
	return list.indexOf(value);
};

export const ListTransformers = { len, lookup, filterBy, find, left, right, indexOf };

// ==================

// Built-Ins: String Transformers

const substr = (str: string, start: number, end?: number): string => {
	return str.substring(start, end);
};

const strlen = (str: string): number => {
	return str.length;
};

const strLeft = (str: string, len: number): string => {
	return str.substring(0, len);
};

const strRight = (str: string, len: number): string => {
	return str.substring(-len);
};

const strIndexOf = (str: string, substr: string): number => {
	return str.indexOf(substr);
};

export const StringTransformers = { substr, strlen, strLeft, strRight, strIndexOf };

// ==================

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
