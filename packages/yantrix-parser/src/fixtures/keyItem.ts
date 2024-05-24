// import { createContext } from 'vm';
import { TKeyItems, TKeyItem } from '../types/keyItem.js';
import { expressions, functions, getExpression, TExpression, TExpressionTypes } from './expressions.js';
import { randomString } from '../utils/utils.js';

// partial<type>

type TContextDescription = {
	context: TKeyItems;
	payload?: TKeyItems;
	prevContext?: TKeyItems;
};

const baseKeyItemDeclaration = {
	TargetProperty: 'property',
};

const targetProperty = (propertyName: string = randomString()) => ({ TargetProperty: propertyName });
const createExpression = () => {};

const createKeyItemDeclaration = (keyItem?: TKeyItem): TKeyItem => ({
	KeyItemDeclaration: {
		TargetProperty: randomString(),
		...keyItem,
	},
});

const createContextDescription = (
	contextKeyItems: TKeyItems,
	payloadKeyItems?: TKeyItems,
	prevContextKeyItems?: TKeyItems,
): TContextDescription => ({
	context: contextKeyItems,
	payload: payloadKeyItems,
	prevContext: prevContextKeyItems,
});

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

/// Base key item declaration
const declarationKeyItem = getKeyItem(null);
export const withStringInitial = getKeyItem(expressions.string);
export const withArrayInitial = getKeyItem(expressions.array);
export const withIntegerInitial = getKeyItem(expressions.integer);
export const withPropertyInitial = getKeyItem(expressions.property);

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
};
