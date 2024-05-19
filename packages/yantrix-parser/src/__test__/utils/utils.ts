import { primitiveWithValue } from '../fixtures/expressions.js';

const randomString = (length: number = 10) => {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
};
const randomInteger = () => `${Math.floor(Math.random() * 20000) - 10000}`;

const randomDecimal = (min: number, max: number, decimalPlaces: number) => {
	const rand = Math.random() * (max - min) + min;
	return `${rand.toFixed(decimalPlaces)}`;
};

const KeyItemsCount = 50;

export const allowedExpressions = {
	string: {
		value: randomString,
		output: (str: string) => {
			return primitiveWithValue.string(str.slice(1, str.length - 1));
		},
	},
	integer: {
		value: randomInteger,
		output: (value: string) => primitiveWithValue.integer(Number(value)),
	},
	decimal: {
		value: () => randomDecimal(-10000, 10000, 4),
		output: (value: string) => primitiveWithValue.decimal(Number(value)),
	},
	property: {
		value: randomString,
		output: (property: string) => primitiveWithValue.property(property),
	},
	function: {
		value: () => randomString() + '()',
		output: (name: string) => {
			return primitiveWithValue.function(name.slice(0, name.length - 2));
		},
	},
	array: {
		value: () => '[]',
		output: (s: string) => primitiveWithValue.array(),
	},
};

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
