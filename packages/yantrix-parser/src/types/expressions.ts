/**
 * This object contains the different types of expressions that can be used in the parser.
 */
export const ExpressionTypes = {
	Function: 'function',
	StringDeclaration: 'string',
	ArrayDeclaration: 'array',
	Constant: 'constant',
	IntegerDeclaration: 'integer',
	DecimalDeclaration: 'decimal',
	Property: 'property',
} as const;

export type TExpressionTypesKeys = keyof typeof ExpressionTypes;

type TExpressionString = {
	StringDeclaration: string;
};
type TExpressionArray = {
	ArrayDeclaration: [];
};
type TExpressionProperty = {
	Property: any;
};
type TExpressionNumber = {
	NumberDeclaration: number;
};
type TFunctionArgument = TExpressionNumber | TExpressionString | TExpressionProperty;

type TExpressionFunction = {
	FunctionDeclaration: {
		FunctionName: string;
		Arguments?: TFunctionArgument[];
	};
};

export type TMapped = {
	[ExpressionTypes.ArrayDeclaration]: TExpressionArray;
	[ExpressionTypes.Function]: TExpressionFunction;
	[ExpressionTypes.IntegerDeclaration]: TExpressionNumber;
	[ExpressionTypes.DecimalDeclaration]: TExpressionNumber;
	[ExpressionTypes.StringDeclaration]: TExpressionString;
	[ExpressionTypes.Property]: TExpressionProperty;
};

export type TMappedKeys = keyof TMapped;
export type TExpressionMapped<T extends keyof TMapped> = TMapped[T];

export type TExpression<T extends TMappedKeys> = {
	expressionType: T;
} & TExpressionMapped<T>;
