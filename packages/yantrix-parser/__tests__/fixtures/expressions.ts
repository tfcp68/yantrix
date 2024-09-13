import { randomDecimal, randomInteger, randomString } from '@yantrix/utils';
import { Map } from 'immutable';
import { ExpressionTypes } from '../../src/constants/index.js';

function getStringExpressionProperties(value: string = randomString()) {
	return {
		StringDeclaration: value,
		expressionType: ExpressionTypes.StringDeclaration,
	};
}
function getIntegerExpressionProperties(value: number = randomInteger()) {
	return {
		NumberDeclaration: value,
		expressionType: ExpressionTypes.IntegerDeclaration,
	};
}
function getDecimalExpressionProperties(value: number = randomDecimal()) {
	return {
		NumberDeclaration: value,
		expressionType: ExpressionTypes.DecimalDeclaration,
	};
}
function getConstantExpressionProperties(value: string = randomString()) {
	return {
		identifier: value,
		expressionType: ExpressionTypes.Constant,
	};
}

function getContextRefrenceExpressionProperties(name: string = randomString()) {
	return {
		identifier: name,
		expressionType: ExpressionTypes.Context,
	};
}

function getPayloadReferenceExpressionProperties(name: string = randomString()) {
	return {
		identifier: name,
		expressionType: ExpressionTypes.Payload,
	};
}
function getArrayExpressionProperties() {
	return {
		ArrayDeclaration: [],
		expressionType: ExpressionTypes.ArrayDeclaration,
	};
}
function getFunctionExpressionProperties(name: string = randomString(), args: any[] = []) {
	return {
		FunctionDeclaration: {
			FunctionName: name,
			Arguments: args,
		},
		expressionType: ExpressionTypes.Function,
	};
}

export const expressionProperties = {
	string: getStringExpressionProperties,
	integer: getIntegerExpressionProperties,
	decimal: getDecimalExpressionProperties,
	contextReference: getContextRefrenceExpressionProperties,
	payloadReference: getPayloadReferenceExpressionProperties,
	constantRefrence: getConstantExpressionProperties,
	function: getFunctionExpressionProperties,
	array: getArrayExpressionProperties,
};

type TKeysPrimitive = keyof typeof expressionProperties;
type TExpressionsPrimitive = {
	[K in TKeysPrimitive]: ReturnType<(typeof expressionProperties)[K]>;
};
export type TPrimitives = TExpressionsPrimitive[TKeysPrimitive];

export const functions = {
	withPropertyArgs: {
		expressionType: ExpressionTypes.Function,
		FunctionDeclaration: {
			FunctionName: `func-${randomString()}`,
			Arguments: [
				{
					identifier: randomString(),
					expressionType: ExpressionTypes.Context,
				},
			],
		},
	},
	withStringArgs: {
		expressionType: ExpressionTypes.Function,
		FunctionDeclaration: {
			FunctionName: `func-${randomString()}`,
			Arguments: [getStringExpressionProperties()],
		},
	},
	withIntegerArgs: {
		expressionType: ExpressionTypes.Function,
		FunctionDeclaration: {
			FunctionName: `func-${randomString()}`,
			Arguments: [getIntegerExpressionProperties()],
		},
	},
	withDecimalArgs: {
		expressionType: ExpressionTypes.Function,
		FunctionDeclaration: {
			FunctionName: `func-${randomString()}`,
			Arguments: [getDecimalExpressionProperties()],
		},
	},
	withArrayArgs: {
		expressionType: ExpressionTypes.Function,
		FunctionDeclaration: {
			FunctionName: `func-${randomString()}`,
			Arguments: [getArrayExpressionProperties()],
		},
	},
	withConstantArgs: {
		expressionType: ExpressionTypes.Function,
		FunctionDeclaration: {
			FunctionName: `func-${randomString()}`,
			Arguments: [getConstantExpressionProperties()],
		},
	},
	// withMultiplyArgs: {
	// 	expressionType: ExpressionTypes.Function,
	// 	FunctionDeclaration: {
	// 		FunctionName: 'func-' + randomString(),
	// 		Arguments: [
	// 			{
	// 				Property: 'first-' + randomString(),
	// 				expressionType: ExpressionTypes.Property,
	// 			},
	// 			{
	// 				Property: 'second-' + randomString(),
	// 				expressionType: ExpressionTypes.Property,
	// 			},
	// 		],
	// 	},
	// },
	withRecursiveFunction: {
		expressionType: ExpressionTypes.Function,
		FunctionDeclaration: {
			FunctionName: `func-${randomString()}`,
			Arguments: [
				{
					FunctionDeclaration: {
						FunctionName: `func-${randomString()}`,
						Arguments: [],
					},
					expressionType: ExpressionTypes.Function,
				},
			],
		},
	},
};

type TKeysFunctions = keyof typeof functions;
export type TFunctionValues = (typeof functions)[TKeysFunctions];

export type TExpression = TFunctionValues | TPrimitives;

type TRecordExpression = Record<'Expression', TExpression>;
export function getExpression(primitiveObj: TExpression): TRecordExpression {
	return {
		Expression: Map<string, any>(primitiveObj).toJS() as TExpression,
	};
}

export const expressions = Object.fromEntries(
	Object.entries(expressionProperties).map(([k, v]) => [k, getExpression(v())]),
) as Record<TKeysPrimitive, TRecordExpression>;

type TKeys = keyof typeof expressions;
export type TExpressionTypes = (typeof expressions)[TKeys];
