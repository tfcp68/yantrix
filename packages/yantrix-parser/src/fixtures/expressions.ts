import { Map } from 'immutable';
import { ExpressionTypes } from '../types/expressions.js';
import { randomString, randomInteger, randomDecimal } from '../utils/utils.js';

const getStringExpressionProperties = (value: string = randomString()) => ({
	StringDeclaration: value,
	expressionType: ExpressionTypes.StringDeclaration,
});
const getIntegerExpressionProperties = (value: number = randomInteger()) => ({
	NumberDeclaration: value,
	expressionType: ExpressionTypes.IntegerDeclaration,
});
const getDecimalExpressionProperties = (value: number = randomDecimal()) => ({
	NumberDeclaration: value,
	expressionType: ExpressionTypes.DecimalDeclaration,
});
const getConstantExpressionProperties = (value: string = randomString()) => ({
	ConstantReference: value.slice(2, -1),
	expressionType: ExpressionTypes.Constant,
});
const getPropertyExpressionProperties = (name: string = randomString()) => ({
	Property: name,
	expressionType: ExpressionTypes.Property,
});
const getArrayExpressionProperties = () => ({
	ArrayDeclaration: [],
	expressionType: ExpressionTypes.ArrayDeclaration,
});
const getFunctionExpressionProperties = (name: string = randomString(), args: any[] = []) => ({
	FunctionDeclaration: {
		FunctionName: name,
		Arguments: args,
	},
	expressionType: ExpressionTypes.Function,
});

export const expressionProperties = {
	string: getStringExpressionProperties,
	integer: getIntegerExpressionProperties,
	decimal: getDecimalExpressionProperties,
	property: getPropertyExpressionProperties,
	function: getFunctionExpressionProperties,
	array: getArrayExpressionProperties,
	constant: getConstantExpressionProperties,
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
			FunctionName: 'func-' + randomString(),
			Arguments: [
				{
					Expression: {
						FunctionProperty: randomString(),
						expressionType: ExpressionTypes.FunctionProperty,
					},
				},
			],
		},
	},
	withStringArgs: {
		expressionType: ExpressionTypes.Function,
		FunctionDeclaration: {
			FunctionName: 'func-' + randomString(),
			Arguments: [getStringExpressionProperties()],
		},
	},
	withIntegerArgs: {
		expressionType: ExpressionTypes.Function,
		FunctionDeclaration: {
			FunctionName: 'func-' + randomString(),
			Arguments: [getIntegerExpressionProperties()],
		},
	},
	withMultiplyArgs: {
		expressionType: ExpressionTypes.Function,
		FunctionDeclaration: {
			FunctionName: 'func-' + randomString(),
			Arguments: [
				{
					Expression: {
						expressionType: ExpressionTypes.FunctionProperty,
						FunctionProperty: 'first-' + randomString(),
					},
				},
				{
					Expression: {
						expressionType: ExpressionTypes.FunctionProperty,
						FunctionProperty: 'second-' + randomString(),
					},
				},
			],
		},
	},
	withRecursiveFunction: {
		expressionType: ExpressionTypes.Function,
		FunctionDeclaration: {
			FunctionName: 'func-' + randomString(),
			Arguments: [
				{
					FunctionDeclaration: {
						FunctionName: 'func-' + randomString(),
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
export const getExpression = (primitiveObj: TExpression): TRecordExpression => ({
	Expression: Map<string, any>(primitiveObj).toJS() as TExpression,
});

export const expressions = <Record<TKeysPrimitive, TRecordExpression>>(
	Object.fromEntries(Object.entries(expressionProperties).map(([k, v]) => [k, getExpression(v())]))
);

type TKeys = keyof typeof expressions;
export type TExpressionTypes = (typeof expressions)[TKeys];
