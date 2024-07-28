import { expressionProperties } from '../fixtures/expressions.js';
import { randomString, randomInteger, randomDecimal } from '@yantrix/utils';

const KeyItemsCount = 50;

export const allowedExpressions = {
	string: {
		value: randomString,
		output: (str: string) => {
			return expressionProperties.string(str);
		},
	},
	integer: {
		value: () => randomInteger().toString(),
		output: (value: string) => expressionProperties.integer(Number(value)),
	},
	decimal: {
		value: () => randomDecimal(-10000, 10000).toFixed(4),
		output: (value: string) => expressionProperties.decimal(Number(value)),
	},
	context: {
		value: randomString,
		output: (property: string) => expressionProperties.contextReference(property),
	},
	payload: {
		value: randomString,
		output: (property: string) => expressionProperties.payloadReference(property),
	},
	function: {
		value: () => randomString() + '()',
		output: (name: string) => {
			return expressionProperties.function(name.slice(0, name.length - 2));
		},
	},
	array: {
		value: () => '[]',
		output: () => expressionProperties.array(),
	},
	constant: {
		value: () => `${randomString()}`,
		output: (s: string) => expressionProperties.constantRefrence(s),
	},
} as const;

export const generateRandomKeyList = () => {
	const defaultName = 'prop';
	const length = Math.floor(Math.random() * KeyItemsCount) + 1;
	return Array.from({ length }, (_, i) => `${defaultName}${i}`);
};
export const getKeyItemsInitialEmpty = () => {
	const keyItemsName = generateRandomKeyList();

	return keyItemsName.map((value) => {
		return {
			value,
			output: () => {
				return {
					keyItem: {
						identifier: value,
					},
				};
			},
		};
	});
};
export const getKeyItemsWithInitial = (expression: any) => {
	const keyItems = generateRandomKeyList();

	return keyItems.map((key) => {
		const generated = expression.value();

		switch (expression) {
			case allowedExpressions.string:
				return {
					key,
					initialValue: generated,
					input: `${key}='${generated}'`,
				};
			case allowedExpressions.constant:
				return {
					key,
					initialValue: generated,
					input: `${key}=%%${generated}`,
				};
			case allowedExpressions.payload:
				return {
					key,
					initialValue: generated,
					input: `${key}=$${generated}`,
				};
			case allowedExpressions.context:
				return {
					key,
					initialValue: generated,
					input: `${key}=#${generated}`,
				};
			default:
				return {
					key,
					initialValue: generated,
					input: `${key}=${generated}`,
				};
		}
	});
};

export const getKeyItemsRandomInitial = (isRandomEmptyErr: boolean = false): any => {
	const keyItems = generateRandomKeyList();
	const expressions = Object.values(allowedExpressions);

	const randomExpression = () => expressions[Math.floor(Math.random() * expressions.length)];

	const listKeyItem = keyItems.map((el) => {
		const expressions = randomExpression();
		const rndValue = expressions.value();

		switch (expressions) {
			case allowedExpressions.string:
				return {
					value: `${el}="${rndValue}"`,
					output: expressions.output(rndValue),
				};
				break;
			case allowedExpressions.constant:
				return {
					value: `${el}=%%${rndValue}`,
					output: expressions.output(rndValue),
				};
			case allowedExpressions.context:
				return {
					value: `${el}=#${rndValue}`,
					output: expressions.output(rndValue),
				};
				break;
			case allowedExpressions.payload:
				return {
					value: `${el}=$${rndValue}`,
					output: expressions.output(rndValue),
				};
			default:
				return {
					value: `${el}=${rndValue}`,
					output: expressions.output(rndValue),
				};
				break;
		}

		return {
			value: `${el}=${rndValue}`,
			output: expressions.output(rndValue),
		};
	});

	if (isRandomEmptyErr) {
		return [
			...listKeyItem,
			{
				value: () => ',',
				output: () => {},
			},
		];
	} else {
		return listKeyItem;
	}
};
