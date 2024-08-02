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

// Built-Ins: Statistics

export const statistics = {};

// Built-Ins: List Transformers

export const list_transformers = {};

// Built-Ins: String Transformers

export const string_transformers = {};

export default {
	...arithmetics,
	...special_maths,
	...statistics,
	...list_transformers,
	...string_transformers,
};
