export enum TExpressionTypes {
	Function,
	Property,
	StringDeclaration,
	ArrayDeclaration,
	Constant,
	IntegerDeclaration,
	FunctionProperty,
}
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
type TFunctionArgument = TExpressionInteger | TExpressionString | TExpressionFunctionProperty;

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
			: T extends TExpressionTypes.IntegerDeclaration
				? TExpressionInteger
				: T extends TExpressionTypes.FunctionProperty
					? TExpressionFunction
					: T extends TExpressionTypes.Property
						? TExpressionProperty
						: never;
