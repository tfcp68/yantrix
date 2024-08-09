export const conditional_expressions = {
	if: '(condition, true_value, false_value): unknown => condition === true ? true_value : false_value',
	case: '',
	coalesce: '',
	random: '',
};

export const binary_predicates = {};

export const numeric_predicates = {};

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
