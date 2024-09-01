// Built-Ins: Conditional expressions
function _if(condition: boolean, true_value: unknown, false_value: unknown): unknown {
	return condition === true ? true_value : false_value;
}

function _wrapper<T extends number | boolean | unknown>(callback: (nums: T[]) => T) {
	return (...nums: T[]) => {
		if (nums.length === 1 && Array.isArray(nums[0])) {
			return callback(nums[0]);
		} else {
			return callback(nums as T[]);
		}
	};
}

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

const _coalesce = _wrapper((expressions: unknown[]): unknown => {
	return expressions.find((exp: unknown) => exp !== null) ?? null;
});

function _random(min?: number, max?: number): number {
	if (min && max) {
		return Math.floor(Math.random() * (max - min) + min);
	} else {
		return Math.random() > 0.5 ? 1 : 0;
	}
}

export const Conditionals = {
	if: _if,
	case: _case,
	coalesce: _coalesce,
	random: _random,
};

// ==================

// Built-Ins: Binary Predicates

const and = _wrapper((conditions: boolean[]): boolean => {
	return conditions.find(cond => cond === false) ?? true;
});
const or = _wrapper((conditions: boolean[]): boolean => {
	return conditions.find(cond => cond === true) ?? false;
});
function not(condition: boolean): boolean {
	return !condition;
}
const none = _wrapper((conditions: boolean[]): boolean => {
	return !(conditions.find(cond => cond === false) ?? true);
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

function isEven(num: number): boolean {
	return num % 2 === 0;
}
function isOdd(num: number): boolean {
	return num % 2 !== 0;
}
function isInteger(num: number): boolean {
	return Number.isInteger(num);
};
function isEqual(x: unknown, y: unknown): boolean {
	return typeof x === typeof y && x === y;
}
function isGreater(x: number, y: number): boolean {
	return x > y;
}
function isGreaterOrEqual(x: number, y: number): boolean {
	return x >= y;
}
function isLess(x: number, y: number): boolean {
	return x < y;
}
function isLessOrEqual(x: number, y: number): boolean {
	return x <= y;
}
function isNegative(x: number): boolean {
	return x < 0;
}
function isPositive(x: number): boolean {
	return x > 0;
}

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

function contains(a: unknown, b: unknown): boolean {
	if (typeof a === 'string' && typeof b === 'string') {
		return a.includes(b);
	} else if (typeof a === 'object' && typeof b === 'string') {
		return Object.values(a as object).includes(b); // ?
	} else if (Array.isArray(a)) {
		return a.includes(b);
	}
	return false;
}

function has(a: unknown, b: unknown): boolean {
	if (typeof a === 'object' && a != null && typeof b === 'string') {
		return b in a;
	} else if (Array.isArray(a) && typeof b === 'number') {
		return a[b] !== undefined;
	}
	return false;
}

// ??????
function isNull(exp: object): boolean {
	return exp == null;
}

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
function diff(num1: number, num2: number): number {
	return num1 - num2;
}
const mult = _wrapper((nums: number[]): number => {
	const initialValue = 1;
	return nums.reduce((accumulator, currentValue) => accumulator * currentValue, initialValue);
});

function div(num1: number, num2: number): number {
	return num1 / num2;
}
function pow(num1: number, num2: number): number {
	return num1 ^ num2;
}
function inc(num: number): number {
	return num + 1;
}
function dec(num: number): number {
	return num - 1;
}
function neg(num: number): number {
	return num * -1;
}
function inv(num: number): number {
	return 1 / num;
}
function mod(num1: number, num2: number) {
	return num1 % num2;
}
function trunc(num: number): number {
	return Math.floor(num);
}
function ceil(num: number): number {
	return Math.ceil(num);
}
function round(num: number): number {
	return Math.round(num);
}

export const Arithmetics = { add, diff, mult, div, pow, inc, dec, neg, inv, mod, trunc, ceil, round };

// ==================

// Built-Ins: Special Maths
function sin(num: number): number {
	return Math.sin(num);
}
function cos(num: number): number {
	return Math.cos(num);
}
function sqrt(num: number): number {
	return Math.sqrt(num);
}
function log(num: number, base: number) {
	return Math.log(num) / Math.log(base);
}
function ln(num: number) {
	return Math.log(num);
}
function lg(num: number) {
	return Math.log10(num);
}
function deg(num: number) {
	return num * 57.3;
}
function rad(num: number) {
	return num / 57.3;
}

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
	return nums.reduce((accumulator, currentValue) => accumulator + (currentValue ^ 2), 0);
});

function sumProduct(...nums_lists: number[][]): number {
	return nums_lists
		.map(list => list.reduce((accumulator, currentValue) => accumulator * currentValue, 1))
		.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
}

export const Statistics = { max, min, avg, med, sum, sumsq, sumProduct };

// ==================

// Built-Ins: List Transformers

function len(list: unknown[]) {
	return list.length;
}

function lookup(list: unknown[], value: unknown): unknown {
	return list.includes(value) ? value : null;
}

function filterBy(list: object[], property_name: string, value: unknown): object[] {
	return list.filter(obj => property_name in obj && obj[property_name as keyof typeof obj] === value);
}

function find(list: object[], property_name: string, value: unknown): unknown {
	return (
		list.filter(
			obj => property_name in obj && obj[property_name as keyof typeof obj] === value,
		)[0] ?? null
	);
}

function left(list: unknown[], len: number) {
	return list.slice(0, len);
}

function right(list: unknown[], len: number) {
	return list.slice(-len);
}

function indexOf(list: unknown[], value: unknown): number {
	return list.indexOf(value);
}

export const ListTransformers = { len, lookup, filterBy, find, left, right, indexOf };

// ==================

// Built-Ins: String Transformers

function substr(str: string, start: number, end?: number): string {
	return str.substring(start, end);
}

function strlen(str: string): number {
	return str.length;
}

function strLeft(str: string, len: number): string {
	return str.substring(0, len);
}

function strRight(str: string, len: number): string {
	return str.substring(-len);
}

function strIndexOf(str: string, substr: string): number {
	return str.indexOf(substr);
}

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
