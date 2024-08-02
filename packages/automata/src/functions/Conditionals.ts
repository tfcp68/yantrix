// Built-Ins: Conditional expressions
export const _if = (condition: Boolean, true_value: any, false_value: any): any => {
	return condition === true ? true_value : false_value;
};

export const _case = (cases: [condition: Boolean, return_value: any][]): any => {
	for (const [condition, return_value] of cases) {
		if (condition) return return_value;
	}
	return cases[cases.length - 1][1];
};

export const _coalesce = (...expressions: any[]): any => {
	return expressions.find((exp: any) => exp !== null) ?? null;
};

export const _random = (): number => {
	return Math.random() > 0.5 ? 1 : 0;
};

export default {
	if: _if,
	case: _case,
	coalesce: _coalesce,
	random: _random,
};
