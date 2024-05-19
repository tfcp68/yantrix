import { ExpressionTypes } from '../../types/expressions.js';

export const primitives = {
	string: {
		StringDeclaration: 'string',
		expressionType: ExpressionTypes.StringDeclaration,
	},
	integer: {
		IntegerValue: 3,
		expressionType: ExpressionTypes.IntegerDeclaration,
	},
	decimal: {
		DecimalValue: 3.0,
	},
	array: {
		ArrayDeclaration: [],
		expressionType: ExpressionTypes.ArrayDeclaration,
	},
	function: {
		expressionType: ExpressionTypes.Function,
		FunctionDeclaration: {
			FunctionName: 'func',
			Arguments: [],
		},
	},
	property: {
		Property: 'anotherProperty',
		expressionType: ExpressionTypes.Property,
	},
	constant: {
		Property: 'constant',
		expressionType: ExpressionTypes.Constant,
	},
};

const getString = (value: string = 'string') => {
	return {
		StringDeclaration: value,
		expressionType: ExpressionTypes.StringDeclaration,
	};
};
const getInteger = (value: number = 3) => {
	return {
		IntegerValue: value,
		expressionType: ExpressionTypes.IntegerDeclaration,
	};
};
const getDecimal = (value: number = 3.0) => {
	return { DecimalValue: value };
};
const getFunction = (name: string = 'func', args: any = []) => {
	return {
		FunctionDeclaration: {
			FunctionName: name,
			Arguments: [],
		},
		expressionType: ExpressionTypes.Function,
	};
};
const getProperty = (name: string = 'property') => {
	return {
		Property: name,
		expressionType: ExpressionTypes.Property,
	};
};
const getArray = () => {
	return {
		ArrayDeclaration: [],
		expressionType: ExpressionTypes.ArrayDeclaration,
	};
};
const getConstant = (value: string = 'constantName') => {
	return {
		ConstantReference: value.slice(2, -1),
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
		FunctionDeclaration: {
			FunctionName: 'func',
			Arguments: [
				{
					Expression: {
						FunctionProperty: 'property',
						expressionType: ExpressionTypes.FunctionProperty,
					},
				},
			],
		},
	},
	withStringArgs: {
		expressionType: ExpressionTypes.Function,
		FunctionDeclaration: {
			FunctionName: 'func',
			Arguments: [primitives.string],
		},
	},
	withIntegerArgs: {
		expressionType: ExpressionTypes.Function,
		FunctionDeclaration: {
			FunctionName: 'func',
			Arguments: [primitives.integer],
		},
	},
	withMultiplyArgs: {
		expressionType: ExpressionTypes.Function,
		FunctionDeclaration: {
			FunctionName: 'func',
			Arguments: [
				{
					Expression: {
						expressionType: ExpressionTypes.FunctionProperty,
						FunctionProperty: 'first',
					},
				},
				{
					Expression: {
						expressionType: ExpressionTypes.FunctionProperty,
						FunctionProperty: 'second',
					},
				},
			],
		},
	},
	withRecursiveFunction: {
		expressionType: ExpressionTypes.Function,
		FunctionDeclaration: {
			FunctionName: 'func',
			Arguments: [
				{
					expressionType: ExpressionTypes.Function,
					FunctionDeclaration: {
						FunctionName: 'function',
						Arguments: [],
					},
				},
			],
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
