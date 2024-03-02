const primitives = {
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
