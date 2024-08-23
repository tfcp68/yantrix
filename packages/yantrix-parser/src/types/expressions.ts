import { ExpressionTypes } from '../constants';
import { TKeyItemReducer } from './keyItem';

export type TExpressionTypesKeys = keyof typeof ExpressionTypes;

export type TRefereneceType =
	| typeof ExpressionTypes.Payload
	| typeof ExpressionTypes.Constant
	| typeof ExpressionTypes.Context;

type TReference = {
	identifier: string;
};

type TExpressionString = {
	StringDeclaration: string;
};
type TExpressionArray = {
	ArrayDeclaration: [];
};

type TExpressionNumber = {
	NumberDeclaration: number;
};
type TFunctionArgument = TKeyItemReducer | TExpression;

export type TExpressionFunction = {
	FunctionDeclaration: {
		FunctionName: string;
		Arguments: TFunctionArgument[];
	};
};

export type TMapped = {
	[ExpressionTypes.ArrayDeclaration]: TExpressionArray;
	[ExpressionTypes.Function]: TExpressionFunction;
	[ExpressionTypes.IntegerDeclaration]: TExpressionNumber;
	[ExpressionTypes.DecimalDeclaration]: TExpressionNumber;
	[ExpressionTypes.StringDeclaration]: TExpressionString;
	[ExpressionTypes.Context]: TReference;
	[ExpressionTypes.Payload]: TReference;
	[ExpressionTypes.Constant]: TReference;
};

export type TMappedKeys = keyof TMapped;
export type TExpressionMapped<T extends keyof TMapped> = TMapped[T];

export type TExpression<T extends TMappedKeys = TMappedKeys> = {
	expressionType: T;
} & TExpressionMapped<T>;
