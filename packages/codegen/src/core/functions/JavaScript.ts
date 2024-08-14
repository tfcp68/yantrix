// Built-Ins: Conditional expressions
export const _if = (condition: Boolean, true_value: any, false_value: any): any => {
	return condition === true ? true_value : false_value;
};

export const _case = (cases: [condition: Boolean, return_value: any][]): any => {
	for (const [condition, return_value] of cases) {
		if (condition) return return_value;
	}
	return cases[cases.length - 1][1];
};

export const _coalesce = (...expressions: any[]): any => {
	return expressions.find((exp: any) => exp !== null) ?? null;
};

export const _random = (): number => {
	return Math.random() > 0.5 ? 1 : 0;
};

export const conditionals = {
	if: _if,
	case: _case,
	coalesce: _coalesce,
	random: _random,
};

// ==================

// Built-Ins: Binary Predicates
export const and = (...conditions: Boolean[]): Boolean => {
	return conditions.find((cond) => cond === false) ?? true;
};
export const or = (...conditions: Boolean[]): Boolean => {
	return conditions.find((cond) => cond === true) ?? false;
};
export const not = (condition: Boolean): Boolean => {
	return !condition;
};
export const none = (...conditions: Boolean[]): Boolean => {
	// return not(and(...conditions));
	return !(conditions.find((cond) => cond === false) ?? true);
};

export const binary_predicates = {
	and,
	or,
	not,
	none,
};

// ==================

// Built-Ins: Numeric Predicates
export const isEven = (num: number): Boolean => {
	return num % 2 === 0;
};
export const isOdd = (num: number): Boolean => {
	return num % 2 !== 0;
};
export const isInteger = (num: number): Boolean => {
	return Number.isInteger(num);
};
export const isEqual = (x: any, y: any): Boolean => {
	return typeof x == typeof y && x === y;
};
export const isGreater = (x: number, y: number): Boolean => {
	return x > y;
};
export const isGreaterOrEqual = (x: number, y: number): Boolean => {
	return x >= y;
};
export const isLess = (x: number, y: number): Boolean => {
	return x < y;
};
export const isLessOrEqual = (x: number, y: number): Boolean => {
	return x <= y;
};
export const isNegative = (x: number): Boolean => {
	return x < 0;
};
export const isPositive = (x: number): Boolean => {
	return x > 0;
};

export const numeric_predicates = {
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

// function contains(str1: string, str2: string): Boolean;
// function contains(list: any[], val: any): Boolean;
// function contains(obj: Object, str: String): Boolean;

export const contains = (a: unknown, b: unknown): Boolean => {
	if (typeof a === 'string' && typeof b === 'string') {
	} else if (typeof a === 'object' && typeof b === 'string') {
	}
	return false;
};

export const has = (a: unknown, b: unknown): Boolean => {
	return false;
};

export const isNull = (exp: object): Boolean => {
	return false;
};

export const lookup_predicates = {
	contains,
	has,
	isNull,
};

// ==================

// Built-Ins: Arithmetics
export const add = (...nums: number[]): number => {
	const initialValue = 0;
	return nums.reduce((accumulator, currentValue) => accumulator + currentValue, initialValue);
};
export const diff = (num1: number, num2: number): number => {
	return num1 - num2;
};
export const mult = (...nums: number[]): number => {
	const initialValue = 1;
	return nums.reduce((accumulator, currentValue) => accumulator * currentValue, initialValue);
};
export const div = (num1: number, num2: number): number => {
	return num1 / num2;
};
export const pow = (num1: number, num2: number): number => {
	return num1 ^ num2;
};
export const inc = (num: number): number => {
	// return add(num, 1);
	return num + 1;
};
export const dec = (num: number): number => {
	// return diff(num, 1);
	return num - 1;
};
export const neg = (num: number): number => {
	// return mult(num, -1);
	return num * -1;
};
export const inv = (num: number): number => {
	// return div(1, num);
	return 1 / num;
};
export const mod = (num1: number, num2: number) => {
	return num1 % num2;
};
export const trunc = (num: number): number => {
	return Math.floor(num);
};
export const ceil = (num: number): number => {
	return Math.ceil(num);
};
export const round = (num: number): number => {
	return Math.round(num);
};

export const arithmetics = { add, diff, mult, div, pow, inc, dec, neg, inv, mod, trunc, ceil, round };

// ==================

// Built-Ins: Special Maths
export const sin = (num: number): number => {
	return Math.sin(num);
};
export const cos = (num: number): number => {
	return Math.cos(num);
};
export const sqrt = (num: number): number => {
	return Math.sqrt(num);
};
export const log = (num: number, base: number) => {
	return 0;
};
export const ln = (num: number) => {
	return Math.log(num);
};
export const lg = (num: number) => {
	return Math.log10(num);
};
export const deg = (num: number) => {
	// return mult(num, 57.3);
	return num * 57.3;
};
export const rad = (num: number) => {
	// return div(num, 57.3);
	return num / 57.3;
};

export const special_maths = { sin, cos, sqrt, log, ln, lg, deg, rad };

// ==================

// Built-Ins: Statistics

export const statistics = {};

// ==================

// Built-Ins: List Transformers

export const list_transformers = {};

// ==================

// Built-Ins: String Transformers

export const string_transformers = {};

// ==================

export default {
	...conditionals,
	...numeric_predicates,
	...binary_predicates,
	...arithmetics,
	...special_maths,
	...statistics,
	...list_transformers,
	...string_transformers,
};
