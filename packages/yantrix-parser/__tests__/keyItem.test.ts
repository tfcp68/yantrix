import { randomDecimal, randomInteger, randomString, randomValue } from '@yantrix/utils';
import { assert, describe, expect, it } from 'vitest';
import { YantrixParser } from '../src/yantrixParser.js';
import { functionsFixtures, keyItem } from './fixtures/keyItem.js';
import {
	allowedExpressions,
	getKeyItemsInitialEmpty,
	getKeyItemsRandomInitial,
	getKeyItemsWithInitial,
} from './utils/utils.js';

const validCases = [
	[`#{%s}`, keyItem.declarationKeyItem],
	[`#{%s = "%s"}`, keyItem.withStringInitial],
	[`#{%s = %arr}`, keyItem.withArrayInitial],
	[`#{%s = %i}`, keyItem.withIntegerInitial],
	[`#{%s = #%s}`, keyItem.withContextInitial],
	[`#{%s = $%s}`, keyItem.withPayloadInitial],
	[`#{%s = %%%s}`, keyItem.withConstantInitial],

	[`#{%s = %d}`, keyItem.withDecimalInitial],
	[`#{%s = %s()}`, functionsFixtures.expression],
];

const templateFunctions: { [key: string]: (...args: any) => any } = {
	'"%s"': (templateString: string, propertyName: string, func: (...args: any) => any) => {
		const val = randomString();
		return [templateString.replace('"%s"', `"${val}"`), func(propertyName, `"${val}"`)];
	},
	'%s': (templateString: string, propertyName: string, func: (...args: any) => any) => {
		const val = randomString();
		return [templateString.replace('%s', val), func(propertyName, val)];
	},
	'%i': (templateString: string, propertyName: string, func: (...args: any) => any) => {
		const val = randomInteger();
		return [templateString.replace('%i', val.toString()), func(propertyName, val)];
	},
	'%d': (templateString: string, propertyName: string, func: (...args: any) => any) => {
		const val = randomDecimal();
		return [templateString.replace('%d', val.toString()), func(propertyName, val)];
	},
	'%multi': (templateString: string, _: string, func: (...args: any) => any) => {
		const properties = [];
		for (let i = 0; i < randomInteger(1, 5); i++) {
			const propName = randomString();
			const propValue = randomValue();
			properties.push([propName, typeof propValue === 'string' ? `"${propValue}"` : propValue]);
		}
		const str = properties.map(([name, value]) => `${name}=${value}`).join(',');
		return [templateString.replace('%multi', str), func(properties)];
	},
	'%arr': (templateString: string, propertyName: string, func: (...args: any) => any) => {
		return [templateString.replace('%arr', '[]'), func(propertyName)];
	},
	'default': (templateString: string, propertyName: string, func: (...args: any) => any) => {
		return [templateString, func(propertyName)];
	},
};

function generateExpressionStringAndExpectedObject(args: [string, (...args: any) => any]) {
	const templateString = args[0];
	const func = args[1];

	// replacing property name with random string
	const propertyName = randomString();
	const templateStringWithName = templateString.replace('%s', propertyName);

	// afterwards expecting different objects depending on the regex inside function arguments,
	// all names and values need to match to pass tests
	for (const regex in templateFunctions) {
		if (templateStringWithName.match(regex)) {
			return templateFunctions[regex]?.(templateStringWithName, propertyName, func);
		}
	}
	return templateFunctions.default?.(templateStringWithName, propertyName, func);
}
function generateExpressionCases(templates: any[], casesAmount: number = randomInteger(1, 50)) {
	return templates.flatMap((template) => {
		return Array.from({ length: casesAmount }, () => generateExpressionStringAndExpectedObject(template));
	});
}

describe('key list', () => {
	const parser = new YantrixParser();

	describe('the number of arguments must be equal to or less than the number of context arguments', () => {
		const keyItem = getKeyItemsInitialEmpty()[0];
		const strInput = `#{${keyItem?.value}} <= #a, #b`;

		expect(() => parser.parse(strInput)).toThrowError(
			'The number of arguments must be equal to or less than the number of context arguments.',
		);
	});

	describe('single key item', () => {
		const cases = generateExpressionCases(validCases);
		it.each(cases)('%s', (input, res) => {
			const output = parser.parse(input);
			assert.deepOwnInclude(output, res);
		});
	});

	describe('random number of keyItem', () => {
		describe('iNPUT = #{prop1=5, prop2=10, prop5=5...} ------- The same type of data ', () => {
			Object.entries(allowedExpressions).forEach(([_, value]: [string, any]) => {
				it(`data type - `, () => {
					for (let index = 0; index < 100; index++) {
						const keyItems = getKeyItemsWithInitial(value);

						const targetPropertyCount = keyItems.length;
						const formatInput = `#{${keyItems.map(({ input }) => input).join(',')}}`;

						const output = parser.parse(formatInput);

						const { contextDescription } = output;
						const context = contextDescription[0].context;

						expect(targetPropertyCount).toBe(context.length);

						keyItems.forEach(({ initialValue, /* input, */ key }, index) => {
							const { keyItem } = context[index];
							const { identifier } = keyItem;

							const targetPropertyInput = key;

							const targetPropertyValue = initialValue;

							const expected = value.output(targetPropertyValue);

							expect(targetPropertyInput).toBe(identifier);
							expect(keyItem.expression).toStrictEqual(expected);
						});
					}
				});
			});
		});
		it(`iNPUT = #{prop= "5", prop2=4, prop3=[]...} ------- different types of data `, () => {
			for (let index = 0; index < 10; index++) {
				const parser = new YantrixParser();

				const keyItems = getKeyItemsRandomInitial();
				const keyItemsCount = keyItems.length;
				const inputArray = keyItems.map((item: any) => item.value);

				const formattedInput = `#{${inputArray.join(',')}}`;

				const output = parser.parse(formattedInput);

				const { contextDescription } = output;
				const context = contextDescription[0].context;

				expect(keyItemsCount).toBe(context.length);

				keyItems.forEach((item: any, index: any) => {
					const { keyItem } = context[index];
					const { identifier } = keyItem;
					const { expression } = keyItem;

					const targetPropertyInput = item.value.split('=')[0];

					expect(targetPropertyInput).toBe(identifier);
					expect(expression).toStrictEqual(item.output);
				});
			}
		});
		describe('empty last initial value', () => {
			it('iNPUT = #{prop= "5", prop2=4, prop3} -------  empty default value at the end', () => {
				for (let index = 0; index < 10; index++) {
					const parser = new YantrixParser();

					const keyItems = getKeyItemsRandomInitial();
					const f = {
						keyItem: {
							identifier: 'emptyprop',
						},
					};
					const initialEmptyEnd = [
						...keyItems,
						{
							value: 'emptyprop',
							output: () => {
								return { ...f };
							},
						},
					];

					const inputArray = initialEmptyEnd.map((item: any) => item.value);

					const formattedInput = `#{${inputArray.join(',')}}`;
					const output = parser.parse(formattedInput);

					const { contextDescription } = output;
					const context = contextDescription[0].context;

					const lastContextItem = context[context.length - 1];

					expect(lastContextItem).toStrictEqual({ ...f });
				}
			});
			it('iNPUT = #{prop= "5", prop2=4, prop3. prop4, prop5...} ------- empty default value at the end', () => {
				for (let index = 0; index < 10; index++) {
					const parser = new YantrixParser();

					const generatedEmpty = getKeyItemsInitialEmpty();
					const generatedRandomInitial = getKeyItemsRandomInitial();

					const keyItems = [...generatedRandomInitial, ...generatedEmpty];

					const formattedArr = keyItems.map(el => el.value);
					const formattedInput = `#{${formattedArr.join(',')}}`;

					const output = parser.parse(formattedInput);

					const { contextDescription } = output;
					const context = contextDescription[0].context;

					const emptyOutputElements = context.slice(generatedRandomInitial.length);
					emptyOutputElements.forEach((el: any, index: any) => {
						expect(el).toStrictEqual(generatedEmpty[index]?.output());
					});
					expect(emptyOutputElements.length).toBe(generatedEmpty.length);
				}
			});
		});
		describe('incorect input', () => {
			it('iNPUT = #{prop1=5, prop2=, prop5=5} ------- empty values in random arguments', () => {
				const parser = new YantrixParser();
				const keyItems = getKeyItemsRandomInitial(true);

				const itemsValue = keyItems.map((item: any) => item.value);

				const formattedInput = `#{${itemsValue.join(',')}}`;
				expect(() => parser.parse(formattedInput)).toThrowError();
			});
			it('iNPUT = #{prop1=5, prop2=10, prop5=5, } ------- comma at the end ', () => {
				const parser = new YantrixParser();
				const keyItems = [...getKeyItemsRandomInitial(), { value: 'prop3,' }];

				const itemsValue = keyItems.map((item: any) => item.value);

				const formattedInput = `#{${itemsValue.join(',')}}`;
				expect(() => parser.parse(formattedInput)).toThrowError();
			});
			it('iNPUT = #{,prop1=5, prop2=10, prop5=5 } ------- comma at the beginning ', () => {
				const parser = new YantrixParser();
				const keyItems = [{ value: ',prop3=' }, ...getKeyItemsRandomInitial()];

				const itemsValue = keyItems.map((item: any) => item.value);

				const formattedInput = `#{${itemsValue.join(',')}}`;
				expect(() => parser.parse(formattedInput)).toThrowError();
			});
			it('iNPUT = #{prop1=5, prop2=10, , prop5=5 } ------- the comma is duplicated', () => {
				const parser = new YantrixParser();
				const keyItems = getKeyItemsRandomInitial();

				const itemsValue = keyItems.map((item: any, index: any) => {
					if (index === Math.floor(keyItems.length / 2)) {
						return `${item.value},`;
					}
					return item.value;
				});

				const formattedInput = `#{${itemsValue.join(',')}}`;
				expect(() => parser.parse(formattedInput)).toThrowError();
			});
			it('iNPUT = #{pro,p1=5, prop2=10, prop5=5 } ------- incorrect name (invalid symbols in name property)', () => {
				const parser = new YantrixParser();
				const invalidSymbols = ',$,%,^,&,*,(,),+,-,|,\\,/,.,<,>,?'.split(',');
				const randomInvalidSymbol = invalidSymbols[Math.floor(Math.random() * invalidSymbols.length)];
				const keyItems = [{ value: `pro${randomInvalidSymbol}p3=` }, ...getKeyItemsRandomInitial()];
				const itemsValue = keyItems.map((item: any) => item.value);
				const formattedInput = `#{${itemsValue.join(',')}}`;
				const callError = () => parser.parse(formattedInput);
				expect(callError).toThrowError();
			});
		});
	});
});
