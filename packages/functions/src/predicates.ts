// Logical predicates
export const and = (...conditions: boolean[]): boolean => conditions.every(Boolean);
export const or = (...conditions: boolean[]): boolean => conditions.some(Boolean);
export const not = (condition: boolean): boolean => !condition;
export const none = (...conditions: boolean[]): boolean => !and(...conditions);

// Numeric predicates
export const isEven = (num: number): boolean => num % 2 === 0;
export const isOdd = (num: number): boolean => num % 2 !== 0;
export const isInteger = (num: number): boolean => Number.isInteger(num);
export const isEqual = (a: any, b: any): boolean => a === b;
export const isGreater = (a: number, b: number): boolean => a > b;
export const isGreaterOrEqual = (a: number, b: number): boolean => a >= b;
export const isLess = (a: number, b: number): boolean => a < b;
export const isLessOrEqual = (a: number, b: number): boolean => a <= b;
export const isNegative = (num: number): boolean => num < 0;
export const isPositive = (num: number): boolean => num >= 0;

// Lookup predicates
export const contains = (container: string | any[] | Record<string, any>, value: any): boolean => {
	if (typeof container === 'string' && typeof value === 'string') {
		return container.includes(value);
	}
	if (Array.isArray(container)) {
		return container.includes(value);
	}
	if (typeof container === 'object' && container !== null) {
		return Object.values(container).includes(value);
	}
	return false;
};

export const has = (container: any[] | Record<string, any>, key: string | number): boolean => {
	if (Array.isArray(container) && typeof key === 'number') {
		return key >= 0 && key < container.length;
	}
	if (typeof container === 'object' && container !== null && typeof key === 'string') {
		return key in container;
	}
	return false;
};

export const isNull = (value: any): boolean => value === null;
