import {
	expressions,
	functions,
	getExpression,
	TExpressionTypes,
} from './expressions.js';

const baseKeyItemDeclaration = {
	TargetProperty: 'property',
};

const getKeyItem = (expression: TExpressionTypes | null) => {
	return {
		contextDescription: [
			{
				context: [
					{
						KeyItemDeclaration: {
							...expression,
							...baseKeyItemDeclaration,
						},
					},
				],
			},
		],
	};
};

const getKeyItemWithMultipleExpressions = (...expressions: Array<TExpressionTypes | null>) => {
	return {
		contextDescription: [
			{
				context: expressions.map((expression, ix) => ({
					KeyItemDeclaration: {
						...expression,
						...{
							TargetProperty: `property${ix}`,
						},
					},
				})),
			},
		],
	};

}

/// Base key item declaration
const declarationKeyItem = getKeyItem(null);
export const withStringInitial = getKeyItem(expressions.string);
export const withArrayInitial = getKeyItem(expressions.array);
export const withIntegerInitial = getKeyItem(expressions.integer);
export const withPropertyInitial = getKeyItem(expressions.property);
export const withDecimalInitial = getKeyItem(expressions.decimal);
export const withMultiplyInitial = getKeyItemWithMultipleExpressions(expressions.decimal, expressions.string, expressions.integer);

/// Base function declaration
const expression = getKeyItem(expressions.function);
const withString = getKeyItem(getExpression(functions.withStringArgs));
const withProperty = getKeyItem(getExpression(functions.withPropertyArgs));
const withInteger = getKeyItem(getExpression(functions.withIntegerArgs));
const recursive = getKeyItem(getExpression(functions.withRecursiveFunction));
const multiplyProperty = getKeyItem(getExpression(functions.withMultiplyArgs));

export const functionsFixtures = {
	expression,
	recursive,
	withInteger,
	withProperty,
	withString,
	multiplyProperty,
};
export const keyItem = {
	declarationKeyItem,
	withStringInitial,
	withArrayInitial,
	withIntegerInitial,
	withPropertyInitial,
	withDecimalInitial,
	withMultiplyInitial
};
