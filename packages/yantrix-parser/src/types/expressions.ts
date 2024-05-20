export enum TExpressionTypes {
	Function,
	Property,
	StringDeclaration,
	ArrayDeclaration,
	Constant,
	NumberDeclaration,
	FunctionProperty,
}
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
export type TExpressionMapped<T extends TExpressionTypes = TExpressionTypes> =
	T extends TExpressionTypes.ArrayDeclaration
		? TExpressionArray
		: T extends TExpressionTypes.StringDeclaration
			? TExpressionString
			: T extends TExpressionTypes.NumberDeclaration
				? TExpressionNumber
				: T extends TExpressionTypes.FunctionProperty
					? TExpressionFunction
					: T extends TExpressionTypes.Property
						? TExpressionProperty
						: never;
