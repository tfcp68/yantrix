export const ExpressionTypes = {
	Function: 'function',
	StringDeclaration: 'string',
	ArrayDeclaration: 'array',
	Constant: 'constant',
	NumberDeclaration: 'number',
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
	NumberDeclaration: number;
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
	[ExpressionTypes.NumberDeclaration]: TExpressionNumber;
	[ExpressionTypes.StringDeclaration]: TExpressionString;
	[ExpressionTypes.Property]: TExpressionProperty;
};

export type TMappedKeys = keyof TMapped;
