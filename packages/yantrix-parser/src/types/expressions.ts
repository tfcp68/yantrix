export const ExpressionTypes = {
	Function: 'function',
	StringDeclaration: 'string',
	ArrayDeclaration: 'array',
	Constant: 'constant',
	IntegerDeclaration: 'integer',
	DecimalDeclaration: 'decimal',
	FunctionProperty: 'FunctionProperty',
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
type TExpressionFunctionProperty = {
	Property: any;
};
type TExpressionNumber = {
	NumberExpression: number;
};
type TFunctionArgument = TExpressionNumber | TExpressionString | TExpressionFunctionProperty;

type TExpressionFunction = {
	FunctionDeclaration: {
		FunctionName: string;
		Arguments?: TFunctionArgument[];
	};
};

export type TMapped = {
	[ExpressionTypes.ArrayDeclaration]: TExpressionArray;
	[ExpressionTypes.FunctionProperty]: TExpressionFunctionProperty;
	[ExpressionTypes.Function]: TExpressionFunction;
	[ExpressionTypes.IntegerDeclaration]: TExpressionNumber;
	[ExpressionTypes.DecimalDeclaration]: TExpressionNumber;
	[ExpressionTypes.StringDeclaration]: TExpressionString;
	[ExpressionTypes.Property]: TExpressionProperty;
};

export type TMappedKeys = keyof TMapped;
export type TExpressionMapped<T extends keyof TMapped> = TMapped[T];
