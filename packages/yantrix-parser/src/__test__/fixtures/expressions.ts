import { property } from 'lodash-es';

export const primitives = {
	string: {
		StringDeclaration: 'string',
	},
	integer: {
		IntegerValue: 3,
	},
	array: {
		ArrayDeclaration: [],
	},
	function: {
		FunctionDeclaration: {
			FunctionName: 'func',
			Arguments: [],
		},
	},
	property: {
		Property: 'anotherProperty',
	},
	decimal: {
		DecimalValue: 3.14,
	},
};

const getString = (value: string = 'string') => {
	return { StringDeclaration: value };
};
const getInteger = (value: number = 3) => {
	return { IntegerValue: value };
};
const getFunction = (name: string = 'func', args: any = []) => {
	return {
		FunctionDeclaration: {
			FunctionName: name,
			Arguments: [],
		},
	};
};
const getProperty = (name: string = 'property') => {
	return {
		Property: name,
	};
};
const getArray = () => {
	return {
		ArrayDeclaration: [],
	};
};
const getDecimal = (value: number = 3.14) => {
	return {
		DecimalValue: value,
	};
};
export const primitiveWithValue = {
	string: getString,
	integer: getInteger,
	property: getProperty,
	function: getFunction,
	array: getArray,
	decimal: getDecimal,
};

type TKeysPrimitive = keyof typeof primitives;
export type TPrimitives = (typeof primitives)[TKeysPrimitive];

export const functions = {
	withPropertyArgs: {
		FunctionDeclaration: {
			FunctionName: 'func',
			Arguments: [
				{
					FunctionProperty: 'property',
				},
			],
		},
	},
	withStringArgs: {
		FunctionDeclaration: {
			FunctionName: 'func',
			Arguments: [primitives.string],
		},
	},
	withIntegerArgs: {
		FunctionDeclaration: {
			FunctionName: 'func',
			Arguments: [primitives.integer],
		},
	},
	withMultiplyArgs: {
		FunctionDeclaration: {
			FunctionName: 'func',
			Arguments: [
				{
					FunctionProperty: 'first',
				},
				{
					FunctionProperty: 'second',
				},
			],
		},
	},
	withRecursiveFunction: {
		FunctionDeclaration: {
			FunctionName: 'func',
			Arguments: [
				{
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
