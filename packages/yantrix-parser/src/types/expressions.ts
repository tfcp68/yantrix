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
type TFunctionArgument = TKeyItemReducer | TExpressionMap;

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

type TWithout<T, K> = Pick<T, Exclude<keyof T, K>>;
export type TDefineMap = TWithout<TMapped, 'context' | 'payload' | 'constant'>;
export type TDefineMapKeys = keyof TMapped;
export type TExpressionDefineMapped<T extends keyof TMapped> = TMapped[T];

export type TMappedKeys = keyof TMapped;
export type TExpressionMapped<T extends keyof TMapped> = TMapped[T];

export type TExpression<T extends TMappedKeys> = {
	expressionType: T;
} & TExpressionMapped<T>;

export type TExpressionDefine<T extends TDefineMapKeys> = {
	expressionType: T;
} & TExpressionDefineMapped<T>;

export type TExpressionMap = {
	[T in TMappedKeys]: TExpression<T>;
}[TMappedKeys];

export type TExpressionDefineMap = {
	[T in TDefineMapKeys]: TExpressionDefineMapped<T>;
}[TDefineMapKeys];
