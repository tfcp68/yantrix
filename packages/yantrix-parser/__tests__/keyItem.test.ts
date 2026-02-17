import { randomDecimal, randomInteger, randomString, randomValue } from '@yantrix/utils';
import { describe, expect, it } from 'vitest';
import {
	getContextStatements,
	YantrixParser,
} from '../src';
import { functionsFixtures, keyItem } from './fixtures/keyItem.js';
import {
	allowedExpressions,
	getKeyItemsInitialEmpty,
	getKeyItemsRandomInitial,
	getKeyItemsWithInitial,
} from './utils/utils';

const validCases = [
	[`#{%s}`, keyItem.declarationKeyItem],
	[`#{%s = "%s"}`, keyItem.withStringInitial],
	[`#{%s = %arr}`, keyItem.withArrayInitial],
	[`#{%s = %i}`, keyItem.withIntegerInitial],
	[`#{%s = #%s}`, keyItem.withContextInitial],
	[`#{%s = $%s}`, keyItem.withPayloadInitial],
	[`#{%s = %%%s}`, keyItem.withConstantInitial],
	['#{%multi}', keyItem.withMultipleInitials],
	[`#{%s = %d}`, keyItem.withDecimalInitial],
	[`#{%s = %s()}`, functionsFixtures.expression],
];

const templateFunctions: { [key: string]: (...args: any) => any } = {
	'"%s"': (templateString: string, propertyName: string, func: (...args: any) => any) => {
		const val = randomString();
		return [templateString.replace('"%s"', `"${val}"`), func(propertyName, `${val}`)];
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
		const propsForExpected: Array<[string, string | number]> = [];
		const partsForInput: string[] = [];

		for (let i = 0; i < randomInteger(1, 5); i++) {
			const propName = randomString();
			const raw = randomValue();

			if (typeof raw === 'string') {
				partsForInput.push(`${propName}="${raw}"`);
				propsForExpected.push([propName, raw]);
			} else {
				partsForInput.push(`${propName}=${raw}`);
				propsForExpected.push([propName, raw]);
			}
		}

		const str = partsForInput.join(',');
		return [templateString.replace('%multi', str), func(propsForExpected)];
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

	const propertyName = randomString();
	const templateStringWithName = templateString.replace('%s', propertyName);

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

	describe('single key item (fixtures)', () => {
		const cases = generateExpressionCases(validCases, 20);

		it.each(cases)('%s', (input, expected) => {
			const output = parser.parse(input);
			expect(output).toMatchObject(expected);
		});
	});

	describe('random number of keyItem', () => {
		describe('same type of data', () => {
			Object.entries(allowedExpressions).forEach(([_, value]: [string, any]) => {
				it(`data type`, () => {
					for (let index = 0; index < 50; index++) {
						const keyItems = getKeyItemsWithInitial(value);

						const targetPropertyCount = keyItems.length;
						const formatInput = `#{${keyItems.map(({ input }) => input).join(',')}}`;

						const output = parser.parse(formatInput);
						const context = getContextStatements(output)[0]!.items;

						expect(targetPropertyCount).toBe(context.length);

						keyItems.forEach(({ initialValue, key }, index) => {
							const item = context[index]!;
							const expected = value.output(initialValue);

							expect(key).toBe(item.identifier);
							expect(item.defaultValue).toMatchObject(expected);
						});
					}
				});
			});
		});

		it(`different types of data`, () => {
			for (let index = 0; index < 20; index++) {
				const keyItems = getKeyItemsRandomInitial();
				const keyItemsCount = keyItems.length;
				const inputArray = keyItems.map((item: any) => item.value);

				const formattedInput = `#{${inputArray.join(',')}}`;

				const output = parser.parse(formattedInput);
				const context = getContextStatements(output)[0]!.items;

				expect(keyItemsCount).toBe(context.length);

				keyItems.forEach((item: any, index: number) => {
					const keyItem = context[index]!;
					const targetPropertyInput = item.value.split('=')[0];

					expect(targetPropertyInput).toBe(keyItem.identifier);
					expect(keyItem.defaultValue).toMatchObject(item.output);
				});
			}
		});

		describe('empty default value at the end', () => {
			it('single trailing identifier-only item has no defaultValue', () => {
				for (let index = 0; index < 10; index++) {
					const keyItems = getKeyItemsRandomInitial();
					const last = 'emptyprop';

					const inputArray = [...keyItems.map((item: any) => item.value), last];
					const formattedInput = `#{${inputArray.join(',')}}`;

					const output = parser.parse(formattedInput);
					const context = getContextStatements(output)[0]!.items;

					const lastItem = context.at(-1)!;
					expect(lastItem.identifier).toBe(last);
					expect(lastItem.defaultValue).toBeUndefined();
				}
			});

			it('multiple trailing identifier-only items have no defaultValue', () => {
				for (let index = 0; index < 10; index++) {
					const generatedEmpty = getKeyItemsInitialEmpty();
					const generatedRandomInitial = getKeyItemsRandomInitial();

					const keyItems = [...generatedRandomInitial, ...generatedEmpty];

					const formattedArr = keyItems.map(el => el.value);
					const formattedInput = `#{${formattedArr.join(',')}}`;

					const output = parser.parse(formattedInput);
					const context = getContextStatements(output)[0]!.items;

					const emptyOutputElements = context.slice(generatedRandomInitial.length);
					emptyOutputElements.forEach((el: any, index: number) => {
						expect(el.identifier).toBe(generatedEmpty[index]?.value);
						expect(el.defaultValue).toBeUndefined();
					});
					expect(emptyOutputElements.length).toBe(generatedEmpty.length);
				}
			});
		});

		describe('incorrect input', () => {
			it('empty values in random arguments', () => {
				const keyItems = getKeyItemsRandomInitial(true);

				const itemsValue = keyItems.map((item: any) => item.value);
				const formattedInput = `#{${itemsValue.join(',')}}`;

				expect(() => parser.parse(formattedInput)).toThrowError();
			});

			it('comma at the end', () => {
				const keyItems = [...getKeyItemsRandomInitial(), { value: 'prop3,' }];

				const itemsValue = keyItems.map((item: any) => item.value);
				const formattedInput = `#{${itemsValue.join(',')}}`;

				expect(() => parser.parse(formattedInput)).toThrowError();
			});

			it('comma at the beginning', () => {
				const keyItems = [{ value: ',prop3=' }, ...getKeyItemsRandomInitial()];

				const itemsValue = keyItems.map((item: any) => item.value);
				const formattedInput = `#{${itemsValue.join(',')}}`;

				expect(() => parser.parse(formattedInput)).toThrowError();
			});

			it('the comma is duplicated', () => {
				const keyItems = getKeyItemsRandomInitial();

				const itemsValue = keyItems.map((item: any, index: number) => {
					if (index === Math.floor(keyItems.length / 2)) {
						return `${item.value},`;
					}
					return item.value;
				});

				const formattedInput = `#{${itemsValue.join(',')}}`;
				expect(() => parser.parse(formattedInput)).toThrowError();
			});

			it('incorrect name (invalid symbols in name property)', () => {
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

	describe('context with reducer', () => {
		it('should parse context with single reducer item', () => {
			const result = parser.parse('#{prop1} <= $payload1');
			const contexts = getContextStatements(result);
			expect(contexts[0]!.reducer.length).toBeGreaterThan(0);
		});

		it('should parse context with multiple reducer items', () => {
			const result = parser.parse('#{prop1, prop2} <= $p1, $p2');
			const contexts = getContextStatements(result);
			expect(contexts[0]!.reducer.length).toBe(2);
		});

		it('should throw when reducer has more items than context', () => {
			expect(() => parser.parse('#{prop1} <= $p1, $p2')).toThrow();
		});
	});

	describe('function call syntax', () => {
		it('should throw if there is whitespace between function name and "(" in key item default value', () => {
			expect(() => parser.parse('#{prop1 = MyFunc ()}')).toThrow();
		});
	});
});
