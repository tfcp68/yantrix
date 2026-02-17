import { randomDecimal, randomInteger, randomString } from '@yantrix/utils';
import {
	ArrayLiteral,
	Expression,
	FunctionCall,
	NumberLiteral,
	StringLiteral,
} from '../../src';
import { TConstRef, TCtxRef, TDataObj, TPayRef } from './types';

export const expressionTypes = {
	string: 'StringLiteral',
	integer: 'NumberLiteral',
	decimal: 'NumberLiteral',
	array: 'ArrayLiteral',
	contextReference: 'ContextReference',
	payloadReference: 'PayloadReference',
	constant: 'Constant',
	function: 'FunctionCall',
	dataObject: 'DataObject',
} as const;

type TStrLit = Omit<StringLiteral, '$container'>;
type TNumLit = Omit<NumberLiteral, '$container'>;
type TArrLit = Omit<ArrayLiteral, '$container'>;

type TExpressionNode = Omit<Expression, '$container'>;
type TFuncCall = Omit<FunctionCall, '$container' | 'args'> & { args: TExpressionNode[] };

function stringLiteral(value = randomString()): TStrLit {
	return {
		$type: expressionTypes.string,
		value: `${value}`,
	};
}

function integerLiteral(value = randomInteger()): TNumLit {
	return {
		$type: expressionTypes.integer,
		value: String(value),
	};
}

function decimalLiteral(value = randomDecimal()): TNumLit {
	return {
		$type: expressionTypes.decimal,
		value: String(value),
	};
}

function arrayLiteral(): TArrLit {
	return { $type: expressionTypes.array };
}

function constantRef(value = randomString()): TDataObj {
	const ref: TConstRef = { $type: expressionTypes.constant, identifier: value };
	return { $type: expressionTypes.dataObject, reference: ref };
}

function contextRef(name = randomString()): TDataObj {
	const ref: TCtxRef = { $type: expressionTypes.contextReference, identifier: name };
	return { $type: expressionTypes.dataObject, reference: ref };
}

function payloadRef(name = randomString()): TDataObj {
	const ref: TPayRef = { $type: expressionTypes.payloadReference, identifier: name };
	return { $type: expressionTypes.dataObject, reference: ref };
}

function functionCall(name = randomString(), args: TExpressionNode[] = []): TFuncCall {
	return { $type: expressionTypes.function, name, args };
}

export const expressionProperties = {
	string: stringLiteral,
	integer: integerLiteral,
	decimal: decimalLiteral,
	contextReference: contextRef,
	payloadReference: payloadRef,
	constantReference: constantRef,
	function: functionCall,
	array: arrayLiteral,
};

type TKeysPrimitive = keyof typeof expressionProperties;
type TExpressionsPrimitive = {
	[K in TKeysPrimitive]: ReturnType<(typeof expressionProperties)[K]>;
};
export type TPrimitives = TExpressionsPrimitive[TKeysPrimitive];

export const functions = {
	withPropertyArgs: functionCall(randomString(), [contextRef(randomString())]),
	withStringArgs: functionCall(randomString(), [stringLiteral()]),
	withIntegerArgs: functionCall(randomString(), [integerLiteral()]),
	withDecimalArgs: functionCall(randomString(), [decimalLiteral()]),
	withArrayArgs: functionCall(randomString(), [arrayLiteral()]),
	withConstantArgs: functionCall(randomString(), [constantRef()]),
	withRecursiveFunction: functionCall(randomString(), [functionCall(randomString(), [])]),
};

type TKeysFunctions = keyof typeof functions;
export type TFunctionValues = (typeof functions)[TKeysFunctions];

export type TExpression = TFunctionValues | TPrimitives;

export type TRecordExpression = Record<'Expression', TExpression>;
export function getExpression(primitiveObj: TExpression): TRecordExpression {
	return { Expression: primitiveObj };
}

export const expressions = Object.fromEntries(
	Object.entries(expressionProperties).map(([k, v]) => [k, getExpression(v())]),
) as Record<TKeysPrimitive, TRecordExpression>;

type TKeys = keyof typeof expressions;
export type TExpressionTypes = (typeof expressions)[TKeys];
