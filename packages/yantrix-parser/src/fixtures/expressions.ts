import { ExpressionTypes } from '../types/expressions.js';
import { randomString, randomInteger, randomDecimal } from '../utils/utils.js';

type TExpressionProperty = {
	value?: string;
	name?: string;
	args?: any[];
};

const getStringExpressionProperties = (value: string = randomString()) => ({
	StringDeclaration: value,
	expressionType: ExpressionTypes.StringDeclaration,
});
const getIntegerExpressionProperties = (value: number = randomInteger()) => ({
	NumberDeclaration: value,
	expressionType: ExpressionTypes.IntegerDeclaration,
});

const getFunctionExpressionProperties = (name: string = randomString(), args: any[] = []) => ({
	FunctionDeclaration: {
		FunctionName: name,
		Arguments: args,
	},
	expressionType: ExpressionTypes.Function,
});
const getPropertyExpressionProperties = (name: string = randomString()) => ({
	Property: name,
	expressionType: ExpressionTypes.Property,
});
const getArrayExpressionProperties = () => ({
	ArrayDeclaration: [],
	expressionType: ExpressionTypes.ArrayDeclaration,
});
const getDecimalExpressionProperties = (value: number = randomDecimal()) => ({
	NumberDeclaration: value,
	expressionType: ExpressionTypes.DecimalDeclaration,
});
const getConstantExpressionProperties = (value: string = randomString()) => ({
	ConstantReference: value.slice(2, -1),
	expressionType: ExpressionTypes.Constant,
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

const expressionPrimitives = {
	string: getStringExpressionProperties(),
	integer: getIntegerExpressionProperties(),
	decimal: getDecimalExpressionProperties(),
	property: getPropertyExpressionProperties(),
	function: getFunctionExpressionProperties(),
	array: getArrayExpressionProperties(),
	constant: getConstantExpressionProperties(),
};

type TKeysPrimitive = keyof typeof expressionPrimitives;
export type TPrimitives = (typeof expressionPrimitives)[TKeysPrimitive];

/*
	const getFunctionExpressionProperties = (name: string = randomString(), args: any[] = []) => ({
		FunctionDeclaration: {
			FunctionName: name,
			Arguments: args,
		},
		expressionType: ExpressionTypes.Function,
	});
*/
const createFunctionWithPropertyArgs = (name: string = randomString(), args: any[] = []) => ({
	expressionType: ExpressionTypes.Function,
	FunctionDeclaration: {
		FunctionName: name,
		Arguments: [
			{
				Expression: {
					FunctionProperty: 'property',
					expressionType: ExpressionTypes.FunctionProperty,
				},
			},
		],
	},
});

// withPropertyArgs : { expressionType: string ...}
const functionExpressionPrimitive = (name: string = randomString()) => ({
	Expression: {
		FunctionProperty: 'property',
		expressionType: ExpressionTypes.FunctionProperty,
	},
});

export const functions = {
	withPropertyArgs: getFunctionExpressionProperties(randomString(), [functionExpressionPrimitive()]),
	withStringArgs: getFunctionExpressionProperties(randomString(), [getStringExpressionProperties()]),
	withIntegerArgs: getFunctionExpressionProperties(randomString(), [getIntegerExpressionProperties()]),
	withMultiplyArgs: getFunctionExpressionProperties(randomString(), [
		functionExpressionPrimitive('first'),
		functionExpressionPrimitive('second'),
	]),
	withRecursiveFunction: getFunctionExpressionProperties(randomString(), [getFunctionExpressionProperties()]),
};

type TKeysFunctions = keyof typeof functions;
export type TFunctionValues = (typeof functions)[TKeysFunctions];

export type TExpression = TFunctionValues | TPrimitives;

type TRecordExpression = Record<'Expression', TExpression>;
export const getExpression = (primitiveObj: TExpression): TRecordExpression => {
	return {
		Expression: {
			...primitiveObj,
		},
	};
};

const createExpression = (type: TKeysPrimitive, properties: TExpressionProperty): TRecordExpression => {
	let expValue;
	switch (type) {
		case 'string':
			expValue = getStringExpressionProperties(properties);
			break;
		default:
			expValue = getStringExpressionProperties(properties);
	}
	return {
		Expression: expValue,
	};
};

createExpression(ExpressionTypes.StringDeclaration, { value: 'lol' });

const arrays = Object.entries(expressionPrimitives).map(([key, value]) => {
	const expressions = getExpression(value);
	return { [key]: expressions };
});
export const expressions: Record<TKeysPrimitive, TRecordExpression> = {
	...Object.assign({}, ...arrays),
};

type TKeys = keyof typeof expressions;
export type TExpressionTypes = (typeof expressions)[TKeys];
