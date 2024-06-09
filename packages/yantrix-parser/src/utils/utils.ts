import { expressionProperties } from '../fixtures/expressions.js';
import { randomString, randomInteger, randomDecimal } from '@yantrix/utils';

const KeyItemsCount = 50;

export const allowedExpressions = {
	string: {
		value: randomString,
		output: (str: string) => {
			return expressionProperties.string(str.slice(1, str.length - 1));
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
	property: {
		value: randomString,
		output: (property: string) => expressionProperties.property(property),
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
		output: (s: string) => expressionProperties.constant(s),
	},
};

const trimConstant = (str: string) => str.slice(2, -1);

const formatStringExpressions = (str: string) => {
	return `'${str}'`;
};

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
					KeyItemDeclaration: {
						TargetProperty: value,
					},
				};
			},
		};
	});
};
export const getKeyItemsWithInitial = (expression: any) => {
	const keyItems = generateRandomKeyList();

	return keyItems.map((key) => {
		if (expression === allowedExpressions.string) {
			return `${key}=${formatStringExpressions(expression.value())}`;
		} else if (expression === allowedExpressions.constant) {
			return `${key}=$(${expression.value()})`;
		}
		return `${key}=${expression.value()}`;
	});
};

export const getKeyItemsRandomInitial = (isRandomEmptyErr: boolean = false): any => {
	const keyItems = generateRandomKeyList();
	const expressions = Object.values(allowedExpressions);

	const randomExpression = () => expressions[Math.floor(Math.random() * expressions.length)];

	const listKeyItem = keyItems.map((el) => {
		const expressions = randomExpression();
		const rndValue = expressions.value();

		if (expressions === allowedExpressions.string) {
			const str = formatStringExpressions(rndValue);
			return {
				value: `${el}=${formatStringExpressions(str)}`,
				output: expressions.output(formatStringExpressions(str)),
			};
		} else if (expressions === allowedExpressions.constant) {
			return {
				value: `${el}=$(${rndValue})`,
				output: expressions.output(rndValue),
			};
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
