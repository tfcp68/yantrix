import { Map } from 'immutable';
import { ExpressionTypes } from '../types/expressions.js';
import { randomString, randomInteger, randomDecimal } from '../utils/utils.js';

export const primitives = {
	string: {
		StringDeclaration: randomString(),
		expressionType: ExpressionTypes.StringDeclaration,
	},
	integer: {
		NumberDeclaration: randomInteger(),
		expressionType: ExpressionTypes.IntegerDeclaration,
	},
	decimal: {
		NumberDeclaration: randomDecimal(),
		expressionType: ExpressionTypes.DecimalDeclaration,
	},
	array: {
		ArrayDeclaration: [],
		expressionType: ExpressionTypes.ArrayDeclaration,
	},
	function: {
		FunctionDeclaration: {
			FunctionName: randomString(),
			Arguments: [],
		},
		expressionType: ExpressionTypes.Function,
	},
	property: {
		Property: randomString(),
		expressionType: ExpressionTypes.Property,
	},
	constant: {
		ConstantReference: randomString(),
		expressionType: ExpressionTypes.Constant,
	},
};

const getStringExpressionProperties = (value: string = randomString()) =>
	Map(primitives.string)
		.updateIn(['StringDeclaration'], (v) => value)
		.toJS();
const getIntegerExpressionProperties = (value: number = randomInteger()) =>
	Map(primitives.integer)
		.updateIn(['NumberDeclaration'], (v) => value)
		.toJS();
const getDecimalExpressionProperties = (value: number = randomDecimal()) =>
	Map(primitives.decimal)
		.updateIn(['NumberDeclaration'], (v) => value)
		.toJS();
const getConstantExpressionProperties = (value: string = randomString()) =>
	Map(primitives.constant)
		.updateIn(['ConstantReference'], (v) => value.slice(2, -1))
		.toJS();
const getPropertyExpressionProperties = (name: string = randomString()) =>
	Map(primitives.property)
		.updateIn(['Property'], (v) => name)
		.toJS();
const getArrayExpressionProperties = () => Map(primitives.array).toJS();

const getFunctionExpressionProperties = (name: string = randomString(), args: any[] = []) =>
	Map(primitives.function)
		.updateIn(['FunctionDeclaration', 'FunctionName'], (v) => name)
		.updateIn(['FunctionDeclaration', 'Arguments'], (v) => args)
		.toJS();

export const expressionProperties = {
	string: getStringExpressionProperties,
	integer: getIntegerExpressionProperties,
	decimal: getDecimalExpressionProperties,
	property: getPropertyExpressionProperties,
	function: getFunctionExpressionProperties,
	array: getArrayExpressionProperties,
	constant: getConstantExpressionProperties,
};

type TKeysPrimitive = keyof typeof primitives;
export type TPrimitives = (typeof primitives)[TKeysPrimitive];

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
			Arguments: [primitives.string],
		},
	},
	withIntegerArgs: {
		expressionType: ExpressionTypes.Function,
		FunctionDeclaration: {
			FunctionName: 'func-' + randomString(),
			Arguments: [primitives.integer],
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

const arrays = Object.entries(primitives).map(([key, value]) => {
	const expressions = getExpression(value);
	return { [key]: expressions };
});
export const expressions: Record<TKeysPrimitive, TRecordExpression> = {
	...Object.assign({}, ...arrays),
};

type TKeys = keyof typeof expressions;
export type TExpressionTypes = (typeof expressions)[TKeys];
