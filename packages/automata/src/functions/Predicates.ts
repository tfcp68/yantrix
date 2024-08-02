// ????

// Built-Ins: Binary Predicates
export function and(...conditions: Boolean[]): Boolean {
	return conditions.find((cond) => cond === false) ?? true;
}
export function or(...conditions: Boolean[]): Boolean {
	return conditions.find((cond) => cond === true) ?? false;
}
export function not(condition: Boolean): Boolean {
	return !condition;
}
export function none(...conditions: Boolean[]): Boolean {
	return not(and(...conditions));
}

// Built-Ins: Numeric Predicates
export function isEven(num: number): Boolean {
	return num % 2 === 0;
}
export function isOdd(num: number): Boolean {
	return num % 2 !== 0;
}
export function isInteger(num: number): Boolean {
	return Number.isInteger(num);
}
export function isEqual(x: any, y: any): Boolean {
	return typeof x == typeof y && x === y;
}
export function isGreater(x: number, y: number): Boolean {
	return x > y;
}
export function isGreaterOrEqual(x: number, y: number): Boolean {
	return x >= y;
}
export function isLess(x: number, y: number): Boolean {
	return x < y;
}
export function isLessOrEqual(x: number, y: number): Boolean {
	return x <= y;
}
export function isNegative(x: number): Boolean {
	return x < 0;
}
export function isPositive(x: number): Boolean {
	return x > 0;
}

// Built-Ins: Lookup Predicates

// function contains(str1: string, str2: string): Boolean;
// function contains(list: any[], val: any): Boolean;
// function contains(obj: Object, str: String): Boolean;

export function contains(a: unknown, b: unknown): Boolean {
	if (typeof a === 'string' && typeof b === 'string') {
	} else if (typeof a === 'object' && typeof b === 'string') {
	}
	return false;
}

export function has(a: unknown, b: unknown): Boolean {
	return false;
}

export function isNull(exp: object): Boolean {
	return false;
}

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
