export const ExpressionTypes = {
  Function: 'function',
  StringDeclaration: 'string',
  ArrayDeclaration: 'array',
  Constant: 'constant',
  IntegerDeclaration: 'integer',
  FunctionProperty: 'FunctionProperty',
  Property: 'property',
} as const;

export type TExpressionTypesKeys = keyof typeof ExpressionTypes;

type TExpressionString = {
  StringDeclaration: string;
};
type TExpressionInteger = {
  IntegerValue: number;
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
type TFunctionArgument =
  | TExpressionInteger
  | TExpressionString
  | TExpressionFunctionProperty;

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
  [ExpressionTypes.IntegerDeclaration]: TExpressionInteger;
  [ExpressionTypes.StringDeclaration]: TExpressionString;
  [ExpressionTypes.Property]: TExpressionProperty;
};

export type TMappedKeys = keyof TMapped;
export type TExpressionMapped<T extends keyof TMapped> = TMapped[T];
