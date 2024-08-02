// ????

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

export default {
	and,
	all: and,
	or,
	any: or,
	not,
	none,

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

	contains,
	has,
	isNull,
};
