// Arithmetic transformers
export const add = (...numbers: number[]): number => numbers.reduce((sum, num) => sum + num, 0);
export const diff = (a: number, b: number): number => b - a;
export const mult = (...numbers: number[]): number => numbers.reduce((product, num) => product * num, 1);
export const div = (a: number, b: number): number => a / b;
export const pow = (base: number, exponent: number): number => base ** exponent;
export const inc = (num: number): number => num + 1;
export const dec = (num: number): number => num - 1;
export const neg = (num: number): number => -num;
export const inv = (num: number): number => 1 / num;
export const mod = (a: number, b: number): number => a % b;
export const trunc = (num: number): number => Math.trunc(num);
export const ceil = (num: number): number => Math.ceil(num);
export const round = (num: number): number => Math.round(num);

// Special math transformers
export const sin = (num: number): number => Math.sin(num);
export const cos = (num: number): number => Math.cos(num);
export const sqrt = (num: number): number => Math.sqrt(num);
export const log = (num: number, base: number): number => Math.log(num) / Math.log(base);
export const ln = (num: number): number => Math.log(num);
export const lg = (num: number): number => Math.log10(num);
export const deg = (radians: number): number => radians * (180 / Math.PI);
export const rad = (degrees: number): number => degrees * (Math.PI / 180);

// Statistics transformers
export const max = (...values: number[] | [number[]]): number => {
	const numbers = Array.isArray(values[0]) ? values[0] : values as number[];
	if (numbers.length === 0) throw new Error('Cannot find maximum of empty array');

	const validNumbers = numbers.filter((n): n is number => typeof n === 'number');
	if (validNumbers.length !== numbers.length) throw new Error('Cannot find maximum of array with non-numeric values');

	return Math.max(...validNumbers);
};

export const min = (...values: number[] | [number[]]): number => {
	const numbers = Array.isArray(values[0]) ? values[0] : values as number[];
	if (numbers.length === 0) throw new Error('Cannot find minimum of empty array');

	const validNumbers = numbers.filter((n): n is number => typeof n === 'number');
	if (validNumbers.length !== numbers.length) throw new Error('Cannot find minimum of array with non-numeric values');

	return Math.min(...validNumbers);
};

export const avg = (...values: number[] | [number[]]): number => {
	const numbers = Array.isArray(values[0]) ? values[0] : values as number[];
	if (numbers.length === 0) throw new Error('Cannot calculate average of empty array');

	const validNumbers = numbers.filter((n): n is number => typeof n === 'number');
	if (validNumbers.length === 0) throw new Error('Cannot calculate average of empty array');

	return validNumbers.reduce((sum, num) => sum + num, 0) / validNumbers.length;
};

export const med = (...values: number[] | [number[]]): number => {
	const numbers = Array.isArray(values[0]) ? values[0] : values as number[];
	const sorted = [...numbers].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
};

export const sum = (list: number[]): number => list.reduce((sum, num) => sum + num, 0);
export const sumsq = (list: number[]): number => list.reduce((sum, num) => sum + num * num, 0);
export const sumProduct = (...lists: number[][]): number => {
	if (lists.length === 0) return 0;
	const length = lists[0]!.length;
	if (!lists.every(list => list.length === length)) throw new Error('All lists must have the same length');

	return Array
		.from({ length }, (_, i) => lists.reduce((product, list) => product * list[i]!, 1))
		.reduce((sum, product) => sum + product, 0);
};

// List and string transformers
export function len(str: string): number;
export function len(list: any[]): number;
export function len(input: string | any[]): number {
	return input.length;
}

export function left(str: string, length: number): string;
export function left<T>(list: T[], length: number): T[];
export function left<T>(input: string | T[], length: number): string | T[] {
	if (typeof input === 'string') return input.substring(0, length);
	return input.slice(0, length);
}

export function right(str: string, length: number): string;
export function right<T>(list: T[], length: number): T[];
export function right<T>(input: string | T[], length: number): string | T[] {
	if (typeof input === 'string') return input.substring(Math.max(0, input.length - length));
	return input.slice(-length);
}

export function indexOf(str: string, search: string): number;
export function indexOf<T>(list: T[], value: T): number;
export function indexOf<T>(input: string | T[], search: string | T): number {
	return input.indexOf(search as any);
}

export function concat(...strings: string[]): string;
export function concat<T>(...lists: T[][]): T[];
export function concat<T>(...inputs: (string | T[])[]): string | T[] {
	if (inputs.every(input => typeof input === 'string')) return (inputs as string[]).join('');
	return (inputs as T[][]).reduce((result, list) => [...result, ...list], []);
}

export function sample(str: string, count: number): string;
export function sample<T>(list: T[], count: number): T[];
export function sample<T>(input: string | T[], count: number): string | T[] {
	const n = count >= 1 ? Math.floor(count) : Math.floor(input.length * count);
	if (typeof input === 'string') {
		const chars = input.split('');
		const shuffled = chars.sort(() => Math.random() - 0.5);
		return shuffled.slice(0, n).join('');
	}
	const shuffled = [...input].sort(() => Math.random() - 0.5);

	return shuffled.slice(0, n);
}

export function shuffle(str: string): string;
export function shuffle<T>(list: T[]): T[];
export function shuffle<T>(input: string | T[]): string | T[] {
	if (typeof input === 'string') {
		const chars = input.split('');
		return chars.sort(() => Math.random() - 0.5).join('');
	}

	return [...input].sort(() => Math.random() - 0.5);
}

// List transformers
export const every = <T>(list: T[], n: number, offset: number = 0): T[] => {
	return list.filter((_, index) => (index - offset) % n === 0);
};

export const repeat = <T>(quantity: number, value: T): T[] => Array.from({ length: quantity }, () => value);

// String transformers
export const substr = (str: string, start: number, end?: number): string => str.substring(start, end);

export const padLeft = (str: string, targetLength: number, pattern: string): string => {
	if (str.length >= targetLength || !pattern) return str;
	let result = str;
	while (result.length < targetLength) {
		const remainingLength = targetLength - result.length;
		const prefix = pattern.repeat(Math.ceil(remainingLength / pattern.length));
		result = prefix.slice(0, remainingLength) + result;
	}
	return result;
};

export const padRight = (str: string, targetLength: number, pattern: string): string => {
	if (str.length >= targetLength || !pattern) return str;
	let result = str;
	while (result.length < targetLength) {
		const remainingLength = targetLength - result.length;
		const suffix = pattern.repeat(Math.ceil(remainingLength / pattern.length));
		result = result + suffix.slice(0, remainingLength);
	}
	return result;
};

// Object transformers
export const keys = (obj: Record<string, any>): string[] => Object.keys(obj);
export const values = (obj: Record<string, any>): any[] => Object.values(obj);

export const zip = (keys: (string | number)[], values: any[]): Record<string, any> => {
	if (keys.length !== values.length) {
		throw new Error('Keys and values arrays must have the same length');
	}
	return Object.fromEntries(keys.map((key, i) => [key, values[i]]));
};

export const setAttr = <T extends Record<string, any>>(obj: T, key: string, value: any): T => ({
	...obj,
	[key]: value,
});

export const unsetAttr = <T extends Record<string, any>>(obj: T, key: string): T => {
	const { [key]: _, ...rest } = obj;
	return rest as T;
};

export const merge = <T extends Record<string, any>>(...objects: T[]): T => Object.assign({}, ...objects);

export const intersect = <T extends Record<string, any>>(...objects: T[]): T => {
	if (objects.length === 0) return {} as T;
	const allKeys = objects.map(obj => new Set(Object.keys(obj)));
	const firstKeySet = allKeys[0];
	if (!firstKeySet) return {} as T;
	const commonKeys = [...firstKeySet].filter(key => allKeys.every(keys => keys?.has(key)));
	return merge(...objects.map(obj =>
		Object.fromEntries(commonKeys.map(key => [key, obj[key]])),
	)) as T;
};

// Collection transformers
export const filterBy = <T extends Record<string, any>>(
	collection: T[],
	propertyName: string,
	seekValue: any,
): T[] => collection.filter(item => item[propertyName] === seekValue);

export const omit = <T extends Record<string, any>>(
	collection: T[],
	propertyName: string,
	seekValue: any,
): T[] => collection.filter(item => item[propertyName] !== seekValue);

export const find = <T extends Record<string, any>>(
	collection: T[],
	propertyName: string,
	seekValue: any,
): T | null => collection.find(item => item[propertyName] === seekValue) || null;

export const pick = <T extends Record<string, any>>(
	collection: T[],
	propertyName: string,
): any[] => collection.map(item => item[propertyName]);
