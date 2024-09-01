import { randomString } from '@yantrix/utils';
import { Map } from 'immutable';
import { TMappedKeys } from '../../src/types/expressions.js';
import { TKeyItem, TKeyItems } from '../../src/types/keyItem.js';
import { TExpressionTypes, expressions, functions, getExpression } from './expressions.js';

const identPath = ['contextDescription', 0, 'context', 0, 'keyItem', 'identifier'] as const;
// const reducerPath = ['contextDescription', 0, 'reducer', 0, 'keyItem'] as const;

export function baseKeyItemDeclaration(propertyName?: string, type?: TMappedKeys) {
	return {
		keyItem: {
			identifier: propertyName ?? randomString(),
			...(type && { expressionType: type }),
		},
	};
}
export function createKeyItemDeclaration(keyItem?: TKeyItem) {
	const base = baseKeyItemDeclaration();
	if (keyItem) {
		return Map(base)
			.updateIn(['keyItem'], () => keyItem.keyItem)
			.toJS();
	} else {
		return base;
	}
}

export function createContext(keyItems?: TKeyItems) {
	const contextItems = keyItems ?? [baseKeyItemDeclaration()];
	return {
		contextDescription: [
			{
				context: contextItems,
			},
		],
	};
}

export function createContextDescription(contextKeyItems: TKeyItems, reducer?: TKeyItems) {
	const baseContext = createContext(contextKeyItems);
	return Map(baseContext)
		.updateIn(['contextDescription', 0, 'context'], context => contextKeyItems ?? context)
		.updateIn(['contextDescription', 0, 'reducer'], () => reducer)
		.toJS();
}

export function getKeyItem(expression: TExpressionTypes | null) {
	const keyItem = Map(createKeyItemDeclaration())
		.updateIn(['keyItem', 'expression'], item => expression?.Expression ?? item)
		.toJS() as unknown as TKeyItem;

	return createContextDescription([keyItem]);
}

export function declarationKeyItem(propertyName?: string, path?: [string | number]) {
	const base = getKeyItem(null);
	return Map(base)
		.updateIn(path ?? identPath, name => propertyName ?? name)
		.toJS();
}

export function withStringInitial(propertyName?: string, stringProperty?: string) {
	const base = getKeyItem(expressions.string);
	return Map(base)
		.updateIn(identPath, name => propertyName ?? name)
		.updateIn(
			['contextDescription', 0, 'context', 0, 'keyItem', 'expression', 'StringDeclaration'],
			v => stringProperty?.substring(1, stringProperty.length - 1) ?? v,
		)
		.toJS();
}

export function withArrayInitial(propertyName?: string) {
	const base = getKeyItem(expressions.array);
	return Map(base)
		.updateIn(identPath, name => propertyName ?? name)
		.toJS();
}

export function withIntegerInitial(propertyName?: string, integerValue?: number) {
	const base = getKeyItem(expressions.integer);
	return Map(base)
		.updateIn(identPath, name => propertyName ?? name)
		.updateIn(
			['contextDescription', 0, 'context', 0, 'keyItem', 'expression', 'NumberDeclaration'],
			v => integerValue ?? v,
		)
		.toJS();
}

export function withDecimalInitial(propertyName?: string, decimalValue?: number) {
	const base = getKeyItem(expressions.decimal);
	return Map(base)
		.updateIn(identPath, name => propertyName ?? name)
		.updateIn(
			['contextDescription', 0, 'context', 0, 'keyItem', 'expression', 'NumberDeclaration'],
			v => decimalValue ?? v,
		)
		.toJS();
}

export function withConstantInitial(propertyName?: string, constantValue?: string) {
	const base = getKeyItem(expressions.constantRefrence);
	return Map(base)
		.updateIn(identPath, name => propertyName ?? name)
		.updateIn(
			['contextDescription', 0, 'context', 0, 'keyItem', 'expression', 'identifier'],
			v => constantValue ?? v,
		)
		.toJS();
}

export function withPayloadInitial(propertyName?: string, propertyName2?: string) {
	const base = getKeyItem(expressions.payloadReference);
	return Map(base)
		.updateIn(identPath, name => propertyName ?? name)
		.updateIn(
			['contextDescription', 0, 'context', 0, 'keyItem', 'expression', 'identifier'],
			name => propertyName2 ?? name,
		)
		.toJS();
}

export function withContextInitial(propertyName?: string, reference?: string) {
	const base = getKeyItem(expressions.contextReference);
	return Map(base)
		.updateIn(identPath, name => propertyName ?? name)
		.updateIn(
			['contextDescription', 0, 'context', 0, 'keyItem', 'expression', 'identifier'],
			name => reference ?? name,
		)
		.toJS();
}

export function withMultiplyInitial(properties?: Array<[propName: string, propValue: any]>) {
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
			oldVal[0]?.context.push(...(newVal[0]?.context ?? []));
			return oldVal;
		}, keyItem);
	});
	return base.toJS();
}

/// Base function declaration
/*
const expression = getKeyItem(expressions.function);
const withString = getKeyItem(getExpression(functions.withStringArgs));
const withProperty = getKeyItem(getExpression(functions.withPropertyArgs));
const withInteger = getKeyItem(getExpression(functions.withIntegerArgs));
const recursive = getKeyItem(getExpression(functions.withRecursiveFunction));
const multiplyProperty = getKeyItem(getExpression(functions.withMultiplyArgs));
*/

export function expression(propertyName?: string, functionName?: string) {
	const base = getKeyItem(expressions.function);
	if (propertyName || functionName) {
		const map = Map(base);
		const updated = map
			.updateIn(identPath, name => propertyName ?? name)
			.updateIn(
				['contextDescription', 0, 'context', 0, 'keyItem', 'expression', 'FunctionDeclaration', 'FunctionName'],
				name => functionName ?? name,
			);
		return updated.toJS();
	} else {
		return base;
	}
}

// TODO MAYBE NEED TO UPDATE FOR MULTIPLE ITEMS

export function withProperty(propertyName?: string, functionName?: string, functionPropertyName?: string) {
	const base = getKeyItem(getExpression(functions.withPropertyArgs));
	if (propertyName || functionName || functionPropertyName) {
		const map = Map(base);
		const updated = map
			.updateIn(identPath, name => propertyName ?? name)
			.updateIn(
				['contextDescription', 0, 'context', 0, 'keyItem', 'expression', 'FunctionDeclaration', 'FunctionName'],
				name => functionName ?? name,
			)
			.updateIn(
				[
					'contextDescription',
					0,
					'context',
					0,
					'keyItem',
					'expression',
					'FunctionDeclaration',
					'Arguments',
					0,
					'identifier',
				],
				name => functionPropertyName ?? name,
			);
		return updated.toJS();
	} else {
		return base;
	}
}

export function withString(propertyName?: string, functionName?: string, stringProperty?: string) {
	const base = getKeyItem(getExpression(functions.withStringArgs));
	if (propertyName || functionName || stringProperty) {
		const map = Map(base);
		const updated = map
			.updateIn(identPath, name => propertyName ?? name)
			.updateIn(
				['contextDescription', 0, 'context', 0, 'keyItem', 'expression', 'FunctionDeclaration', 'FunctionName'],
				name => functionName ?? name,
			)
			.updateIn(
				[
					'contextDescription',
					0,
					'context',
					0,
					'keyItem',
					'expression',
					'FunctionDeclaration',
					'Arguments',
					0,
					'StringDeclaration',
				],
				name => stringProperty?.substring(1, stringProperty.length - 1) ?? name,
			);
		return updated.toJS();
	} else {
		return base;
	}
}

export function withInteger(propertyName?: string, functionName?: string, integerValue?: number) {
	const base = getKeyItem(getExpression(functions.withIntegerArgs));
	if (propertyName || functionName || integerValue) {
		const map = Map(base);
		const updated = map
			.updateIn(identPath, name => propertyName ?? name)
			.updateIn(
				['contextDescription', 0, 'context', 0, 'keyItem', 'expression', 'FunctionDeclaration', 'FunctionName'],
				name => functionName ?? name,
			)
			.updateIn(
				[
					'contextDescription',
					0,
					'context',
					0,
					'keyItem',
					'expression',
					'FunctionDeclaration',
					'Arguments',
					0,
					'NumberDeclaration',
				],
				v => integerValue ?? v,
			);
		return updated.toJS();
	} else {
		return base;
	}
}

export function withDecimal(propertyName?: string, functionName?: string, decimalValue?: number) {
	if (Number.isInteger(decimalValue))
		throw new Error('Decimal value must be a float.');
	const base = getKeyItem(getExpression(functions.withDecimalArgs));
	if (propertyName || functionName || decimalValue) {
		const map = Map(base);
		const updated = map
			.updateIn(identPath, name => propertyName ?? name)
			.updateIn(
				['contextDescription', 0, 'context', 0, 'keyItem', 'expression', 'FunctionDeclaration', 'FunctionName'],
				name => functionName ?? name,
			)
			.updateIn(
				[
					'contextDescription',
					0,
					'context',
					0,
					'keyItem',
					'expression',
					'FunctionDeclaration',
					'Arguments',
					0,
					'NumberDeclaration',
				],
				v => decimalValue ?? v,
			);
		return updated.toJS();
	} else {
		return base;
	}
}

// ???
export function withArray(propertyName?: string, functionName?: string) {
	const base = getKeyItem(getExpression(functions.withArrayArgs));
	if (propertyName || functionName) {
		const map = Map(base);
		const updated = map
			.updateIn(identPath, name => propertyName ?? name)
			.updateIn(
				['contextDescription', 0, 'context', 0, 'keyItem', 'expression', 'FunctionDeclaration', 'FunctionName'],
				name => functionName ?? name,
			);
		return updated.toJS();
	} else {
		return base;
	}
}

export function withConstant(propertyName?: string, functionName?: string, constantValue?: string) {
	const base = getKeyItem(getExpression(functions.withConstantArgs));
	if (propertyName || functionName || constantValue) {
		const map = Map(base);
		const updated = map
			.updateIn(identPath, name => propertyName ?? name)
			.updateIn(
				['contextDescription', 0, 'context', 0, 'keyItem', 'expression', 'FunctionDeclaration', 'FunctionName'],
				name => functionName ?? name,
			)
			.updateIn(
				[
					'contextDescription',
					0,
					'context',
					0,
					'keyItem',
					'expression',
					'FunctionDeclaration',
					'Arguments',
					0,
					'identifier',
				],
				(v) => {
					return constantValue ?? v;
				},
			);
		return updated.toJS();
	} else {
		return base;
	}
}

export function recursive(propertyName?: string, functionName?: string, funcRecursiveName?: string) {
	const base = getKeyItem(getExpression(functions.withRecursiveFunction));
	if (propertyName || functionName || funcRecursiveName) {
		const map = Map(base);
		const updated = map
			.updateIn(identPath, name => propertyName ?? name)
			.updateIn(
				['contextDescription', 0, 'context', 0, 'keyItem', 'expression', 'FunctionDeclaration', 'FunctionName'],
				name => functionName ?? name,
			)
			.updateIn(
				[
					'contextDescription',
					0,
					'context',
					0,
					'keyItem',
					'expression',
					'FunctionDeclaration',
					'Arguments',
					0,
					'FunctionDeclaration',
					'FunctionName',
				],
				name => funcRecursiveName ?? name,
			);
		return updated.toJS();
	} else {
		return base;
	}
}

export function multiplyProperty(propertyName?: string,	functionName?: string,	funcPropertyName1?: string,	funcPropertyName2?: string) {
	const base = getKeyItem(getExpression(functions.withArrayArgs));
	if (propertyName || functionName || funcPropertyName1 || funcPropertyName2) {
		const map = Map(base);
		const updated = map
			.updateIn(identPath, name => propertyName ?? name)
			.updateIn(
				['contextDescription', 0, 'context', 0, 'keyItem', 'expression', 'FunctionDeclaration', 'FunctionName'],
				name => functionName ?? name,
			)
			.updateIn(
				[
					'contextDescription',
					0,
					'context',
					0,
					'keyItem',
					'expression',
					'FunctionDeclaration',
					'Arguments',
					0,
					'Property',
				],
				name => funcPropertyName1 ?? name,
			)
			.updateIn(
				[
					'contextDescription',
					0,
					'context',
					0,
					'keyItem',
					'expression',
					'FunctionDeclaration',
					'Arguments',
					1,
					'Property',
				],
				name => funcPropertyName2 ?? name,
			);
		return updated.toJS();
	} else {
		return base;
	}
}

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
	withContextInitial,
	withPayloadInitial,
	withMultiplyInitial,
};
