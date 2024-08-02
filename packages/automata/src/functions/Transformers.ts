// Built-Ins: Arithmetics
export function add(...nums: number[]): number {
	const initialValue = 0;
	return nums.reduce((accumulator, currentValue) => accumulator + currentValue, initialValue);
}
export function diff(num1: number, num2: number): number {
	return num1 - num2;
}
export function mult(...nums: number[]): number {
	const initialValue = 1;
	return nums.reduce((accumulator, currentValue) => accumulator * currentValue, initialValue);
}
export function div(num1: number, num2: number): number {
	return num1 / num2;
}
export function pow(num1: number, num2: number): number {
	return num1 ^ num2;
}
export function inc(num: number): number {
	return add(num, 1);
}
export function dec(num: number): number {
	return diff(num, 1);
}
export function neg(num: number): number {
	return mult(num, -1);
}
export function inv(num: number): number {
	return div(1, num);
}
export function mod(num1: number, num2: number) {
	return num1 % num2;
}
export function trunc(num: number): number {
	return Math.floor(num);
}
export function ceil(num: number): number {
	return Math.ceil(num);
}
export function round(num: number): number {
	return Math.round(num);
}

export const arithmetics = { add, diff, mult, div, pow, inc, dec, neg, inv, mod, trunc, ceil, round };

// Built-Ins: Special Maths
export function sin(num: number): number {
	return Math.sin(num);
}
export function cos(num: number): number {
	return Math.cos(num);
}
export function sqrt(num: number): number {
	return Math.sqrt(num);
}
export function log(num: number, base: number) {
	return 0;
}
export function ln(num: number) {
	return Math.log(num);
}
export function lg(num: number) {
	return Math.log10(num);
}
export function deg(num: number) {
	return mult(num, 57.3);
}
export function rad(num: number) {
	return div(num, 57.3);
}

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
