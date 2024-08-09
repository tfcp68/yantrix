export const conditional_expressions = {
	if: 'args -> (boolean)args[0] == true ? (boolean)args[1] : (boolean)args[2]',
	case: 'args -> null',
	coalesce: 'args -> null',
	random: 'args -> Math.random() > 0.5 ? 1 : 0',
};

export const binary_predicates = {};

export const numeric_predicates = {
	isEven: 'args -> (int)args[0] % 2 == 0',
	isOdd: 'args -> (int)args[0] % 2 != 0',
	isInteger: 'args -> (int)args[0] % 1 == 0',
	isEqual: 'args -> args[0].getClass().equals(args[1].getClass()) && args[0].equals(args[1])',
	isGreater: 'args -> (int)args[0] > (int)args[1]',
	isGreaterOrEqual: 'args -> (int)args[0] >= (int)args[1]',
	isLess: 'args -> (int)args[0] < (int)args[1]',
	isLessOrEqual: 'args -> (int)args[0] <= (int)args[1]',
	isNegative: 'args -> (int)args[0] < 0',
	isPositive: 'args -> (int)args[0] > 0',
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
} as const;
