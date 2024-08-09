export const conditional_expressions = {
	if: '(condition, true_value, false_value) => condition === true ? true_value : false_value',
	case: '() => undefined',
	coalesce: '(...expressions) => expressions.find(exp => exp !== null) ?? null',
	random: '() => Math.random() > 0.5 ? 1 : 0',
};

export const binary_predicates = {
	and: '(...conditions) => conditions.find(cond => cond === false) ?? true',
	or: '(...conditions) => conditions.find(cond => cond === true) ?? false',
	not: '(condition) => !condition',
	none: '(...conditions) => !(conditions.find(cond => cond === false) ?? true)',
};

export const numeric_predicates = {
	isEven: 'num => num % 2 === 0',
	isOdd: 'num => num % 2 !== 0',
	isInteger: 'num => Number.isInteger(num)',
	isEqual: '(x, y) => (typeof x === typeof y && x == y)',
	isGreater: '(x, y) => x > y',
	isGreaterOrEqual: '(x, y) => x >= y',
	isLess: '(x, y) => x < y',
	isLessOrEqual: '(x, y) => x <= y',
	isNegative: '(x) => x < 0',
	isPositive: '(x) => x >= 0',
};

export const lookup_predicates = {};

export const arithmetics = {};

export const special_maths = {};

export const statistics = {};

export const list_transformers = {};

export const string_transformers = {};

export default {
	...conditional_expressions,
	...binary_predicates,
	...numeric_predicates,
	...lookup_predicates,
	...arithmetics,
	...special_maths,
	...statistics,
	...list_transformers,
	...string_transformers,
};
