const _if = <T>(condition: boolean, trueValue: T, falseValue: T): T => (condition ? trueValue : falseValue);

const _case = <T>(...cases: (boolean | T)[]): T => {
	for (let i = 0; i < cases.length - 1; i += 2) {
		if (cases[i] === true) {
			return cases[i + 1] as T;
		}
	}
	return cases[cases.length - 1] as T;
};

const coalesce = <T>(...values: (T | null | undefined)[]): T | null => {
	return values.find(value => value !== null && value !== undefined) ?? null;
};

const random = (min?: number, max?: number): number => {
	if (min && max) return Math.floor(Math.random() * (max - min) + min);
	else return Math.random() > 0.5 ? 1 : 0;
};

export default {
	if: _if,
	case: _case,
	coalesce,
	random,
};
