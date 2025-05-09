import { randomArray, randomDecimal, randomInteger, randomString, randomValue } from '@yantrix/utils';
import { assert, describe, expect, it } from 'vitest';
import { YantrixParser } from '../src';
import { functionsFixtures } from './fixtures/keyItem.js';

type TCaseFunction = [
	string,
	(
		propertyName?: string,
		functionName?: string,
		value?: any,
	) => {
		[p: string]: Array<{ context: unknown }>;
		[p: number]: Array<{ context: unknown }>;
		[p: symbol]: Array<{ context: unknown }>;
	},
];

const functionCasesAndExpectedTypes: TCaseFunction[] = [
	['#{%s = %s()}', functionsFixtures.expression],
	['#{%s = %s("%s")}', functionsFixtures.withString],
	['#{%s = %s(%i)}', functionsFixtures.withInteger],
	['#{%s = %s(%d)}', functionsFixtures.withDecimal],
	['#{%s = %s(%arr)}', functionsFixtures.withArray],
	['#{%s = %s(%%%s)}', functionsFixtures.withConstant],
	['#{%s = %s(%s())}', functionsFixtures.recursive],
];

const validEmptyFunctionsExamples = ['#{%s = %s()}'];
const invalidEmptyFunctionsExamples = [
	'#{%s = %s ()}',
	'#{%s = ()}',
	'#{%s = %s[]}',
	'#{%s = %s{}}',
	'#{%s = %s({})}',
	'#{%s = %s(}',
	'#{%s = %s)}',
	'#{%s = %s(())}',
];

const validFunctionsWithArgumentsExamples = [
	'#{%s = %s("%s")}',
	'#{%s = %s(%i)}',
	'#{%s = %s(%d)}',
	'#{%s = %s(%arr)}',
	'#{%s = %s(#%s, $%s)}',
	'#{%s = %s("%s", #%s)}',
	'#{%s = %s(%%%s)}',
	'#{%s = %s(#%s)}',
	'#{%s = %s($%s)}',
	'#{%s = %s(%%%s,%i)}',
	'#{%s = %s(%i,%i)}',
	'#{%s = %s(%i,%d)}',
	'#{%s = %s(%d,%d)}',
	'#{%s = %s(%arr,%d)}',
	'#{%s = %s(%arr,%arr)}',
	'#{%s = %s(%f)}',
	'#{%s = %s(%f, %i)}',
];
const invalidFunctionsWithArgumentsExamples = [
	'#{%s = %s (%s)}',
	'#{%s = (%s)}',
	'#{%s = %s[%s]}',
	'#{%s = %s{%s}}',
	'#{%s = %s(%s}',
	'#{%s = %s(%%s}',
	'#{%s = %s(##%s}',
	'#{%s = %s($$%s}',
	'#{%s = %s($)}',
	'#{%s = %s(#)}',
	'#{%s = %s(#,)}',
	'#{%s = %s($,)}',
	'#{%s = %s(%%)}',
	'#{%s = %s(,#)}',
	'#{%s = %s(,$)}',
	'#{%s = %s((%s))}',
	'#{%s = %s([%s])}',
	'#{%s = %s("%s" %s)}',
	'#{%s = %s(%s.%s)}',
	'#{%s = %s(%s|%s)}',
	'#{%s = %s(%s=%s)}',
	'#{%s = %s(%s %d)}',
	'#{%s = %s(%s %i)}',
	'#{%s = %s(%s %s)}',
	'#{%s = %s(%d %i)}',
	'#{%s = %s("%s" %s)}',
	'#{%s = %s(%i%s)}',
	'#{%s = %s(%d%s)}',
	'#{%s = %s($())}',
	'#{%s = %s(#{%s})}',
	'#{%s = %s(,,,,,,)}',
	'#{%s = %s(%s(%s(%s(%s(%s(%s(%s(%s()))))))))}',
];

const multiplyNestedFunctionsArguments = [
	`#{%s = %s(%s(%s()))}`,
	`#{%s = %s(%s(%s(%s(%s(%s(%s()))))))}`,
	`#{%s = %s(%s(%s(%s(%s(%s(%s())), %f, %f))), %f)}`,
	`#{%s = %s(%s(%s(%arr,%d)), %i, %f)}`,
];
/**
 * Генерирует массив выражений на основе массива темплейтов, получаемого на входе
 * @param arr
 * @param casesAmount
 * @return string[]
 */
function generateRandomStatementsFromTemplate(arr: string[], casesAmount: number = randomInteger(50, 100)) {
	return arr.flatMap((template) => {
		return Array.from({ length: casesAmount }, () =>
			template
				.replaceAll('%i', () => randomInteger().toString())
				.replaceAll('%d', () => randomDecimal().toString())
				.replaceAll('%rand', () => randomValue().toString())
				.replaceAll('%list', () => randomArray(randomString).join(','))
				.replaceAll('%arr', () => '[]')
				.replaceAll('%f', () => `${randomString()}()`)
				.replaceAll('%s', () => randomString()));
	});
}

function generateFunctionString(level: number = 0) {
	if (level > 8)
		return ''; // todo check

	const argsTypes = [randomInteger, randomDecimal];

	const functionName = randomString();
	const argsCount = randomInteger(1, 10);
	const args: string[] = [];
	for (let i = 0; i < argsCount; i++) {
		const randomIndex = Math.floor(Math.random() * argsTypes.length);
		if (randomIndex === 3) {
			const nestedFunction = generateFunctionString(level + 1);
			if (nestedFunction)
				args.push(nestedFunction);
		} else {
			args.push(argsTypes[randomIndex]?.().toString() ?? '');
		}
	}

	return `${functionName}(${args.join(',')})`;
}

const templateFunctions: { [key: string]: (...args: any) => any } = {
	'"%s"': (templateString: string, propertyName: string, functionName: string, func: (...args: any) => any) => {
		const val = randomString();
		return [templateString.replace('"%s"', `"${val}"`), func(propertyName, functionName, `"${val}"`)];
	},
	'%s': (templateString: string, propertyName: string, functionName: string, func: (...args: any) => any) => {
		const val = randomString();
		return [templateString.replace('%s', val), func(propertyName, functionName, val)];
	},
	'%i': (templateString: string, propertyName: string, functionName: string, func: (...args: any) => any) => {
		const val = randomInteger();
		return [templateString.replace('%i', val.toString()), func(propertyName, functionName, val)];
	},
	'%d': (templateString: string, propertyName: string, functionName: string, func: (...args: any) => any) => {
		const val = randomDecimal();
		return [templateString.replace('%d', val.toString()), func(propertyName, functionName, val)];
	},
	'%multi': (templateString: string, propertyName: string, functionName: string, func: (...args: any) => any) => {
		const propertyName1 = randomString();
		const propertyName2 = randomString();
		return [
			templateString.replace('%multi', `${propertyName1},${propertyName2}`),
			func(propertyName, functionName, propertyName1, propertyName2),
		];
	},
	'%arr': (templateString: string, propertyName: string, functionName: string, func: (...args: any) => any) => {
		return [templateString.replace('%arr', '[]'), func(propertyName, functionName)];
	},
	'default': (templateString: string, propertyName: string, functionName: string, func: (...args: any) => any) => {
		return [templateString, func(propertyName, functionName)];
	},
};

function generateExpressionStringAndExpectedObject(args: [string, (prop?: string, func?: string, ...values: any) => any]) {
	const templateString = args[0];
	const func = args[1];

	// replacing property and function names with random strings
	const propertyName = randomString();
	const functionName = randomString();
	const templateStringWithNames = templateString.replace('%s', propertyName).replace('%s', functionName);

	// afterwards expecting different objects depending on the regex inside function arguments,
	// all names and values need to match to pass tests
	for (const regex in templateFunctions) {
		if (templateStringWithNames.match(regex)) {
			return templateFunctions[regex]?.(templateStringWithNames, propertyName, functionName, func);
		}
	}
	return templateFunctions.default?.(templateStringWithNames, propertyName, functionName, func);
}

// const generateExpressionCases = (templates: any[], casesAmount: number = randomInteger(1, 50)) => {
// 	return templates.flatMap((template) => {
// 		return Array.from({ length: casesAmount }, () => generateExpressionStringAndExpectedObject(template));
// 	});
// };

function generateExpressionCase(template: any, casesAmount: number = randomInteger(1, 50)) {
	return Array.from({ length: casesAmount }, () => generateExpressionStringAndExpectedObject(template));
}

describe('function declaration', () => {
	const parser = new YantrixParser();

	describe('function strings with random sets of random arguments', async () => {
		const cases = Array.from({ length: 1000 }, () => `#{${randomString()} = ${generateFunctionString()}}`);
		it.each(cases)('%s', async (input) => {
			await expect(parser.parse(input)).resolves.toBeDefined();
		});
	});

	describe('empty functions syntax', () => {
		describe('correct functions', () => {
			const cases = generateRandomStatementsFromTemplate(validEmptyFunctionsExamples);
			it.each(cases)('%s', async (input) => {
				await expect(parser.parse(input)).resolves.toBeDefined();
			});
		});

		describe('incorrect functions', () => {
			const cases = generateRandomStatementsFromTemplate(invalidEmptyFunctionsExamples);
			it.each(cases)('%s', async (input) => {
				await expect(async () => await parser.parse(input)).rejects.toThrow();
			});
		});
	});

	describe('functions with arguments syntax', () => {
		describe('correct functions', () => {
			const cases = generateRandomStatementsFromTemplate(validFunctionsWithArgumentsExamples);

			it.each(cases)('%s', async (input) => {
				await expect(parser.parse(input)).resolves.toBeDefined();
			});
		});

		describe('incorrect functions', () => {
			const cases = generateRandomStatementsFromTemplate(invalidFunctionsWithArgumentsExamples);
			it.each(cases)('%s', async (input) => {
				await expect(async () => await parser.parse(input)).rejects.toThrow();
			});
		});
	});

	// @TODO maybe need to add separate describes for each function type, too much unnecessary work for now though
	describe('functions are correctly separated into types: string,decimal,integer etc', () => {
		functionCasesAndExpectedTypes.forEach((template) => {
			describe(`function case - `, async () => {
				const cases = generateExpressionCase(template);
				await it.each(cases)('%s', async (input: string, obj) => {
					const result = await parser.parse(input);
					assert.deepOwnInclude(result, obj);
				});
			});
		});
	});

	// @TODO add dedicated recursion tests
	// need to test limits, should be ~8 levels of nesting, but i think there is actually no limit
	describe('multi-nested arguments as functions', () => {
		const cases = generateRandomStatementsFromTemplate(multiplyNestedFunctionsArguments);
		it.each(cases)('%s', async (input: string) => {
			await expect(parser.parse(input)).resolves.toBeDefined();
		});
	});
});
