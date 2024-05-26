// import { createContext } from 'vm';
import { Map } from 'immutable';
import { TKeyItems, TKeyItem } from '../types/keyItem.js';
import { ExpressionTypes, TMapped } from '../types/expressions.js';
import {
	expressionProperties,
	expressions,
	functions,
	getExpression,
	TExpression,
	TExpressionTypes,
} from './expressions.js';
import { randomString } from '../utils/utils.js';

const baseKeyItemDeclaration = (): TKeyItem => ({
	KeyItemDeclaration: {
		TargetProperty: randomString(),
	},
});
const createKeyItemDeclaration = (keyItem?: TKeyItem) => {
	const base = baseKeyItemDeclaration();
	if (keyItem) {
		return Map(base)
			.updateIn(['KeyItemDeclaration'], (item) => keyItem.KeyItemDeclaration)
			.toJS();
	} else return base;
};

const createContext = (keyItems?: TKeyItems) => {
	const contextItems = keyItems || [baseKeyItemDeclaration()];
	return {
		context: contextItems,
	};
};

const createContextDescription = (
	contextKeyItems?: TKeyItems,
	payloadKeyItems?: TKeyItems,
	prevContextKeyItems?: TKeyItems,
) => {
	const baseContext = createContext(contextKeyItems);
	return Map(baseContext)
		.updateIn(['context'], (items) => contextKeyItems ?? items)
		.updateIn(['payload'], (items) => payloadKeyItems ?? items)
		.updateIn(['prevContext'], (items) => prevContextKeyItems ?? items)
		.toJS();
};

const getKeyItem = (expression: TExpressionTypes | null) => {
	const keyItem = Map(createKeyItemDeclaration())
		.updateIn(['KeyItemDeclaration', 'Expression'], (item) => expression?.Expression ?? item)
		.toJS() as TKeyItem;

	return createContextDescription([keyItem]);
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
