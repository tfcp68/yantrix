// import { createContext } from 'vm';
import { Map } from 'immutable';
import { TKeyItems, TKeyItem } from '../types/keyItem.js';
import { expressions, functions, getExpression, TExpressionTypes } from './expressions.js';
import { randomString } from '@yantrix/utils';

export const baseKeyItemDeclaration = (propertyName?: string): TKeyItem => ({
	KeyItemDeclaration: {
		TargetProperty: propertyName ?? randomString(),
	},
});
export const createKeyItemDeclaration = (keyItem?: TKeyItem) => {
	const base = baseKeyItemDeclaration();
	if (keyItem) {
		return Map(base)
			.updateIn(['KeyItemDeclaration'], (item) => keyItem.KeyItemDeclaration)
			.toJS();
	} else return base;
};

export const createContext = (keyItems?: TKeyItems) => {
	const contextItems = keyItems ?? [baseKeyItemDeclaration()];
	return {
		contextDescription: [
			{
				context: contextItems,
			},
		],
	};
};

export const createContextDescription = (
	contextKeyItems?: TKeyItems,
	payloadKeyItems?: TKeyItems,
	prevContextKeyItems?: TKeyItems,
) => {
	const baseContext = createContext(contextKeyItems);
	return Map(baseContext)
		.updateIn(['contextDescription', 0, 'context'], (context) => contextKeyItems ?? context)
		.updateIn(['contextDescription', 0, 'payload'], (payload) => payloadKeyItems ?? payload)
		.updateIn(['contextDescription', 0, 'prevContext'], (prevContext) => prevContextKeyItems ?? prevContext)
		.toJS();
};

export const getKeyItem = (expression: TExpressionTypes | null) => {
	const keyItem = Map(createKeyItemDeclaration())
		.updateIn(['KeyItemDeclaration', 'Expression'], (item) => expression?.Expression ?? item)
		.toJS() as TKeyItem;

	return createContextDescription([keyItem]);
};

export const declarationKeyItem = (propertyName?: string) => {
	const base = getKeyItem(null);
	return Map(base)
		.updateIn(
			['contextDescription', 0, 'context', 0, 'KeyItemDeclaration', 'TargetProperty'],
			(name) => propertyName ?? name,
		)
		.toJS();
};

export const withStringInitial = (propertyName?: string, stringProperty?: string) => {
	const base = getKeyItem(expressions.string);
	return Map(base)
		.updateIn(
			['contextDescription', 0, 'context', 0, 'KeyItemDeclaration', 'TargetProperty'],
			(name) => propertyName ?? name,
		)
		.updateIn(
			['contextDescription', 0, 'context', 0, 'KeyItemDeclaration', 'Expression', 'StringDeclaration'],
			(v) => stringProperty?.substring(1, stringProperty.length - 1) ?? v,
		)
		.toJS();
};

export const withArrayInitial = (propertyName?: string) => {
	const base = getKeyItem(expressions.array);
	return Map(base)
		.updateIn(
			['contextDescription', 0, 'context', 0, 'KeyItemDeclaration', 'TargetProperty'],
			(name) => propertyName ?? name,
		)
		.toJS();
};

export const withIntegerInitial = (propertyName?: string, integerValue?: number) => {
	const base = getKeyItem(expressions.integer);
	return Map(base)
		.updateIn(
			['contextDescription', 0, 'context', 0, 'KeyItemDeclaration', 'TargetProperty'],
			(name) => propertyName ?? name,
		)
		.updateIn(
			['contextDescription', 0, 'context', 0, 'KeyItemDeclaration', 'Expression', 'NumberDeclaration'],
			(v) => integerValue ?? v,
		)
		.toJS();
};

export const withDecimalInitial = (propertyName?: string, decimalValue?: number) => {
	const base = getKeyItem(expressions.decimal);
	return Map(base)
		.updateIn(
			['contextDescription', 0, 'context', 0, 'KeyItemDeclaration', 'TargetProperty'],
			(name) => propertyName ?? name,
		)
		.updateIn(
			['contextDescription', 0, 'context', 0, 'KeyItemDeclaration', 'Expression', 'NumberDeclaration'],
			(v) => decimalValue ?? v,
		)
		.toJS();
};

export const withConstantInitial = (propertyName?: string, constantValue?: string) => {
	const base = getKeyItem(expressions.constant);
	return Map(base)
		.updateIn(
			['contextDescription', 0, 'context', 0, 'KeyItemDeclaration', 'TargetProperty'],
			(name) => propertyName ?? name,
		)
		.updateIn(
			['contextDescription', 0, 'context', 0, 'KeyItemDeclaration', 'Expression', 'ConstantReference'],
			(v) => constantValue ?? v,
		)
		.toJS();
};

export const withPropertyInitial = (propertyName?: string, propertyName2?: string) => {
	const base = getKeyItem(expressions.property);
	return Map(base)
		.updateIn(
			['contextDescription', 0, 'context', 0, 'KeyItemDeclaration', 'TargetProperty'],
			(name) => propertyName ?? name,
		)
		.updateIn(
			['contextDescription', 0, 'context', 0, 'KeyItemDeclaration', 'Expression', 'Property'],
			(name) => propertyName2 ?? name,
		)
		.toJS();
};

export const withMultiplyInitial = (properties?: [propName: string, propValue: any][]) => {
	const base = Map(getKeyItem(null)).deleteIn(['contextDescription', 0, 'context', 0]);
	properties?.forEach(([name, value]) => {
		let keyItem = {};
		if (typeof value === 'string') {
			keyItem = withStringInitial(name, value);
		} else if (typeof value === 'number') {
			keyItem = Number.isInteger(value) ? withIntegerInitial(name, value) : withDecimalInitial(name, value);
		} else if (Array.isArray(value)) {
			keyItem = withArrayInitial(name);
		}
		base.mergeWith((oldVal: any, newVal: any) => {
			oldVal[0]?.context.push(...newVal[0]?.context);
			return oldVal;
		}, keyItem);
	});
	return base.toJS();
};

/// Base function declaration
/*
const expression = getKeyItem(expressions.function);
const withString = getKeyItem(getExpression(functions.withStringArgs));
const withProperty = getKeyItem(getExpression(functions.withPropertyArgs));
const withInteger = getKeyItem(getExpression(functions.withIntegerArgs));
const recursive = getKeyItem(getExpression(functions.withRecursiveFunction));
const multiplyProperty = getKeyItem(getExpression(functions.withMultiplyArgs));
*/

export const expression = (propertyName?: string, functionName?: string) => {
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

// TODO MAYBE NEED TO UPDATE FOR MULTIPLE ITEMS

export const withProperty = (propertyName?: string, functionName?: string, functionPropertyName?: string) => {
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
					'Property',
				],
				(name) => functionPropertyName ?? name,
			);
		return updated.toJS();
	} else return base;
};

export const withString = (propertyName?: string, functionName?: string, stringProperty?: string) => {
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

export const withInteger = (propertyName?: string, functionName?: string, integerValue?: number) => {
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

export const withDecimal = (propertyName?: string, functionName?: string, decimalValue?: number) => {
	if (Number.isInteger(decimalValue)) throw new Error();
	const base = getKeyItem(getExpression(functions.withDecimalArgs));
	if (propertyName || functionName || decimalValue) {
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
				(v) => decimalValue ?? v,
			);
		return updated.toJS();
	} else return base;
};

// ???
export const withArray = (propertyName?: string, functionName?: string) => {
	const base = getKeyItem(getExpression(functions.withArrayArgs));
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

export const withConstant = (propertyName?: string, functionName?: string, constantValue?: string) => {
	const base = getKeyItem(getExpression(functions.withConstantArgs));
	if (propertyName || functionName || constantValue) {
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
					'ConstantReference',
				],
				(v) => constantValue ?? v,
			);
		return updated.toJS();
	} else return base;
};

export const recursive = (propertyName?: string, functionName?: string, funcRecursiveName?: string) => {
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

export const multiplyProperty = (
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
					'Property',
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
					'Property',
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
	withDecimal,
	withArray,
	withConstant,
	withProperty,
	withString,
	multiplyProperty,
};
export const keyItem = {
	declarationKeyItem,
	withStringInitial,
	withArrayInitial,
	withIntegerInitial,
	withDecimalInitial,
	withConstantInitial,
	withPropertyInitial,
	withMultiplyInitial,
};
