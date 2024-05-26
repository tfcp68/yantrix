import { ExpressionTypes } from '../../types/expressions.js';

export const primitives = {
	string: {
		value: {
			StringDeclaration: 'string',
		},
		expressionType: ExpressionTypes.StringDeclaration,
	},
	integer: {
		value: {
			NumberDeclaration: 3,
		},
		expressionType: ExpressionTypes.NumberDeclaration,
	},
	array: {
		value: {
			ArrayDeclaration: [],
		},
		expressionType: ExpressionTypes.ArrayDeclaration,
	},
	function: {
		expressionType: ExpressionTypes.Function,
		value: {
			FunctionDeclaration: {
				FunctionName: 'func',
				Arguments: [],
			},
		},
	},
	property: {
		value: {
			Property: 'anotherProperty',
		},
		expressionType: ExpressionTypes.Property,
	},
	constant: {
		value: {
			Property: 'constant',
		},
		expressionType: ExpressionTypes.Constant,
	},
	decimal: {
		value: {
			NumberDeclaration: 3.14,
		},
		expressionType: ExpressionTypes.NumberDeclaration,
	},
};

const getString = (value: string = 'string') => {
	return {
		value: { StringDeclaration: value },
		expressionType: ExpressionTypes.StringDeclaration,
	};
};
const getInteger = (value: number = 3) => {
	return {
		value: { NumberDeclaration: value },
		expressionType: ExpressionTypes.NumberDeclaration,
	};
};
const getFunction = (name: string = 'func', args: any = []) => {
	return {
		value: {
			FunctionDeclaration: {
				FunctionName: name,
				Arguments: [],
			},
		},
		expressionType: ExpressionTypes.Function,
	};
};
const getProperty = (name: string = 'property') => {
	return {
		value: {
			Property: name,
		},
		expressionType: ExpressionTypes.Property,
	};
};
const getArray = () => {
	return {
		value: {
			ArrayDeclaration: [],
		},
		expressionType: ExpressionTypes.ArrayDeclaration,
	};
};
const getDecimal = (value: number = 3.14) => {
	return {
		value: { NumberDeclaration: value },
		expressionType: ExpressionTypes.NumberDeclaration,
	};
};
const getConstant = (value: string = 'constantName') => {
	return {
		value: {
			ConstantReference: value.slice(2, -1),
		},
		expressionType: ExpressionTypes.Constant,
	};
};

export const primitiveWithValue = {
	string: getString,
	integer: getInteger,
	decimal: getDecimal,
	property: getProperty,
	function: getFunction,
	array: getArray,
	constant: getConstant,
};

type TKeysPrimitive = keyof typeof primitives;
export type TPrimitives = (typeof primitives)[TKeysPrimitive];

export const functions = {
	withPropertyArgs: {
		expressionType: ExpressionTypes.Function,
		value: {
			FunctionDeclaration: {
				FunctionName: 'func',
				Arguments: [
					{
						Expression: {
							value: { FunctionProperty: 'property' },
							expressionType: ExpressionTypes.FunctionProperty,
						},
					},
				],
			},
		},
	},
	withStringArgs: {
		expressionType: ExpressionTypes.Function,
		value: {
			FunctionDeclaration: {
				FunctionName: 'func',
				Arguments: [primitives.string],
			},
		},
	},
	withIntegerArgs: {
		expressionType: ExpressionTypes.Function,
		value: {
			FunctionDeclaration: {
				FunctionName: 'func',
				Arguments: [primitives.integer],
			},
		},
	},
	withMultiplyArgs: {
		expressionType: ExpressionTypes.Function,
		value: {
			FunctionDeclaration: {
				FunctionName: 'func',
				Arguments: [
					{
						Expression: {
							expressionType: ExpressionTypes.FunctionProperty,
							value: {
								FunctionProperty: 'first',
							},
						},
					},
					{
						Expression: {
							expressionType: ExpressionTypes.FunctionProperty,
							value: {
								FunctionProperty: 'second',
							},
						},
					},
				],
			},
		},
	},
	withRecursiveFunction: {
		expressionType: ExpressionTypes.Function,
		value: {
			FunctionDeclaration: {
				FunctionName: 'func',
				Arguments: [
					{
						expressionType: ExpressionTypes.Function,
						value: {
							FunctionDeclaration: {
								FunctionName: 'function',
								Arguments: [],
							},
						},
					},
				],
			},
		},
	},
};
type TKeysFunctions = keyof typeof functions;
export type TFunctionValues = (typeof functions)[TKeysFunctions];

type TExpression = TFunctionValues | TPrimitives;

type TRecordExpression = Record<'Expression', TExpression>;
export const getExpression = (primitiveObj: TExpression): TRecordExpression => {
	return {
		Expression: {
			...primitiveObj,
		},
	};
};
const arrays = Object.entries(primitives).map(([key, value]) => {
	const expressions = getExpression(value);
	return { [key]: expressions };
});
export const expressions: Record<TKeysPrimitive, TRecordExpression> = {
	...Object.assign({}, ...arrays),
};

type TKeys = keyof typeof expressions;
export type TExpressionTypes = (typeof expressions)[TKeys];
