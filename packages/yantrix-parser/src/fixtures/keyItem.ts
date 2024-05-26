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
		contextDescription: [
			{
				context: contextItems,
			},
		],
	};
};

const createContextDescription = (
	contextKeyItems?: TKeyItems,
	payloadKeyItems?: TKeyItems,
	prevContextKeyItems?: TKeyItems,
) => {
	const baseContext = createContext(contextKeyItems);
	return Map(baseContext)
		.updateIn(['contextDescription'], (desc) => {
			const array = <Array<any>>desc;
			if (contextKeyItems) array[0].context = contextKeyItems;
			if (payloadKeyItems) array[0].payload = payloadKeyItems;
			if (prevContextKeyItems) array[0].prevContext = prevContextKeyItems;
			return array;
		})
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
// const expression = getKeyItem(expressions.function);
// const withString = getKeyItem(getExpression(functions.withStringArgs));
// const withProperty = getKeyItem(getExpression(functions.withPropertyArgs));
// const withInteger = getKeyItem(getExpression(functions.withIntegerArgs));
// const recursive = getKeyItem(getExpression(functions.withRecursiveFunction));
// const multiplyProperty = getKeyItem(getExpression(functions.withMultiplyArgs));

const expression = (propertyName?: string, functionName?: string) => {
	const base = getKeyItem(expressions.function);
	if (propertyName || functionName) {
		const map = Map(base);
		const updated = map
			.updateIn(
				['contextDescription', 0, 'context', 0, 'KeyItemDeclaration', 'TargetProperty'],
				(name) => propertyName ?? name,
			)
			.updateIn(
				[
					'contextDescription',
					0,
					'context',
					0,
					'KeyItemDeclaration',
					'Expression',
					'FunctionDeclaration',
					'FunctionName',
				],
				(name) => functionName ?? name,
			);
		return updated.toJS();
	} else return base;
};

const withProperty = (propertyName?: string, functionName?: string, functionPropertyName?: string) => {
	const base = getKeyItem(getExpression(functions.withPropertyArgs));
	if (propertyName || functionName || functionPropertyName) {
		const map = Map(base);
		const updated = map
			.updateIn(
				['contextDescription', 0, 'context', 0, 'KeyItemDeclaration', 'TargetProperty'],
				(name) => propertyName ?? name,
			)
			.updateIn(
				[
					'contextDescription',
					0,
					'context',
					0,
					'KeyItemDeclaration',
					'Expression',
					'FunctionDeclaration',
					'FunctionName',
				],
				(name) => functionName ?? name,
			)
			.updateIn(
				[
					'contextDescription',
					0,
					'context',
					0,
					'KeyItemDeclaration',
					'Expression',
					'FunctionDeclaration',
					'Arguments',
					0,
					'Expression',
					'FunctionProperty',
				],
				(name) => functionPropertyName ?? name,
			);
		return updated.toJS();
	} else return base;
};

const withString = (propertyName?: string, functionName?: string, stringProperty?: string) => {
	const base = getKeyItem(getExpression(functions.withStringArgs));
	if (propertyName || functionName || stringProperty) {
		const map = Map(base);
		const updated = map
			.updateIn(
				['contextDescription', 0, 'context', 0, 'KeyItemDeclaration', 'TargetProperty'],
				(name) => propertyName ?? name,
			)
			.updateIn(
				[
					'contextDescription',
					0,
					'context',
					0,
					'KeyItemDeclaration',
					'Expression',
					'FunctionDeclaration',
					'FunctionName',
				],
				(name) => functionName ?? name,
			)
			.updateIn(
				[
					'contextDescription',
					0,
					'context',
					0,
					'KeyItemDeclaration',
					'Expression',
					'FunctionDeclaration',
					'Arguments',
					0,
					'StringDeclaration',
				],
				(name) => stringProperty?.substring(1, stringProperty.length - 1) ?? name,
			);
		return updated.toJS();
	} else return base;
};

const withInteger = (propertyName?: string, functionName?: string, integerValue?: number) => {
	const base = getKeyItem(getExpression(functions.withIntegerArgs));
	if (propertyName || functionName || integerValue) {
		const map = Map(base);
		const updated = map
			.updateIn(
				['contextDescription', 0, 'context', 0, 'KeyItemDeclaration', 'TargetProperty'],
				(name) => propertyName ?? name,
			)
			.updateIn(
				[
					'contextDescription',
					0,
					'context',
					0,
					'KeyItemDeclaration',
					'Expression',
					'FunctionDeclaration',
					'FunctionName',
				],
				(name) => functionName ?? name,
			)
			.updateIn(
				[
					'contextDescription',
					0,
					'context',
					0,
					'KeyItemDeclaration',
					'Expression',
					'FunctionDeclaration',
					'Arguments',
					0,
					'NumberDeclaration',
				],
				(v) => integerValue ?? v,
			);
		return updated.toJS();
	} else return base;
};

const recursive = (propertyName?: string, functionName?: string, funcRecursiveName?: string) => {
	const base = getKeyItem(getExpression(functions.withRecursiveFunction));
	if (propertyName || functionName || funcRecursiveName) {
		const map = Map(base);
		const updated = map
			.updateIn(
				['contextDescription', 0, 'context', 0, 'KeyItemDeclaration', 'TargetProperty'],
				(name) => propertyName ?? name,
			)
			.updateIn(
				[
					'contextDescription',
					0,
					'context',
					0,
					'KeyItemDeclaration',
					'Expression',
					'FunctionDeclaration',
					'FunctionName',
				],
				(name) => functionName ?? name,
			)
			.updateIn(
				[
					'contextDescription',
					0,
					'context',
					0,
					'KeyItemDeclaration',
					'Expression',
					'FunctionDeclaration',
					'Arguments',
					0,
					'FunctionDeclaration',
					'FunctionName',
				],
				(name) => funcRecursiveName ?? name,
			);
		return updated.toJS();
	} else return base;
};

const multiplyProperty = (
	propertyName?: string,
	functionName?: string,
	funcPropertyName1?: string,
	funcPropertyName2?: string,
) => {
	const base = getKeyItem(getExpression(functions.withMultiplyArgs));
	if (propertyName || functionName || funcPropertyName1 || funcPropertyName2) {
		const map = Map(base);
		const updated = map
			.updateIn(
				['contextDescription', 0, 'context', 0, 'KeyItemDeclaration', 'TargetProperty'],
				(name) => propertyName ?? name,
			)
			.updateIn(
				[
					'contextDescription',
					0,
					'context',
					0,
					'KeyItemDeclaration',
					'Expression',
					'FunctionDeclaration',
					'FunctionName',
				],
				(name) => functionName ?? name,
			)
			.updateIn(
				[
					'contextDescription',
					0,
					'context',
					0,
					'KeyItemDeclaration',
					'Expression',
					'FunctionDeclaration',
					'Arguments',
					0,
					'Expression',
					'FunctionProperty',
				],
				(name) => funcPropertyName1 ?? name,
			)
			.updateIn(
				[
					'contextDescription',
					0,
					'context',
					0,
					'KeyItemDeclaration',
					'Expression',
					'FunctionDeclaration',
					'Arguments',
					1,
					'Expression',
					'FunctionProperty',
				],
				(name) => funcPropertyName2 ?? name,
			);
		return updated.toJS();
	} else return base;
};

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
