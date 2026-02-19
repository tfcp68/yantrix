import { randomArray, randomDecimal, randomInteger, randomString, randomValue } from '@yantrix/utils';
import { assert, describe, expect, it } from 'vitest';
import { getContextStatements, getDefineStatements, YantrixParser } from '../src';
import { functionsFixtures } from './fixtures/keyItem.js';

type TSimpleExpr =
	| { $type: 'FunctionCall'; name: string; args: TSimpleExpr[] }
	| { $type: 'StringLiteral'; value: string }
	| { $type: 'NumberLiteral'; value: string }
	| { $type: 'ArrayLiteral' }
	| { $type: 'DataObject'; reference: { $type: string; identifier: string } };

function simplifyExpression(expr: any): TSimpleExpr {
	if (!expr || typeof expr !== 'object') {
		throw new Error('Expected expression node');
	}

	switch (expr.$type) {
		case 'FunctionCall':
			return {
				$type: 'FunctionCall',
				name: expr.name,
				args: (expr.args ?? []).map((arg: any) => simplifyExpression(arg)),
			};
		case 'StringLiteral':
			return { $type: 'StringLiteral', value: expr.value };
		case 'NumberLiteral':
			return { $type: 'NumberLiteral', value: expr.value };
		case 'ArrayLiteral':
			return { $type: 'ArrayLiteral' };
		case 'DataObject':
			return {
				$type: 'DataObject',
				reference: {
					$type: expr.reference.$type,
					identifier: expr.reference.identifier,
				},
			};
		default:
			throw new Error(`Unknown expression type: ${expr.$type}`);
	}
}

type TCaseFunction = [string, (propertyName: string, functionName: string, value: any) => unknown];

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
	'#{%s = %s([])}',
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

function generateRandomStatementsFromTemplate(arr: string[], casesAmount: number = 10) {
	return arr.flatMap((template) => {
		return Array.from({ length: casesAmount }, () =>
			template
				.replaceAll('%i', () => randomInteger().toString())
				.replaceAll('%d', () => randomDecimal().toFixed(2))
				.replaceAll('%rand', () => randomValue().toString())
				.replaceAll('%list', () => randomArray(randomString).join(','))
				.replaceAll('%arr', () => '[]')
				.replaceAll('%f', () => `${randomString()}()`)
				.replaceAll('%s', () => randomString()));
	});
}

function generateFunctionString(level: number = 0): string {
	if (level > 8) return '';

	const functionName = randomString();
	const argsCount = randomInteger(0, 3);
	const args: string[] = [];

	for (let i = 0; i < argsCount; i++) {
		const randType = randomInteger(0, 2);
		if (randType === 0) {
			args.push(randomInteger().toString());
		} else if (randType === 1) {
			args.push(randomDecimal().toFixed(2));
		} else if (level < 3) {
			const nestedFunction = generateFunctionString(level + 1);
			if (nestedFunction) args.push(nestedFunction);
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

	const propertyName = randomString();
	const functionName = randomString();
	const templateStringWithNames = templateString.replace('%s', propertyName).replace('%s', functionName);

	for (const regex in templateFunctions) {
		if (templateStringWithNames.match(regex)) {
			return templateFunctions[regex]?.(templateStringWithNames, propertyName, functionName, func);
		}
	}
	return templateFunctions.default?.(templateStringWithNames, propertyName, functionName, func);
}

function generateExpressionCase(template: any, casesAmount: number = randomInteger(1, 50)) {
	return Array.from({ length: casesAmount }, () => generateExpressionStringAndExpectedObject(template));
}

describe('function declaration', () => {
	const parser = new YantrixParser();

	describe('function strings with random sets of random arguments', () => {
		const cases = Array.from({ length: 50 }, () => `#{${randomString()} = ${generateFunctionString()}}`);
		it.each(cases)('%s', (input) => {
			const result = parser.parse(input);
			assert.isOk(result);
		});
	});

	describe('empty functions syntax', () => {
		describe('correct functions', () => {
			const cases = generateRandomStatementsFromTemplate(validEmptyFunctionsExamples);
			it.each(cases)('%s', (input) => {
				assert.isOk(parser.parse(input));
			});
		});

		describe('incorrect functions', () => {
			const cases = generateRandomStatementsFromTemplate(invalidEmptyFunctionsExamples);
			it.each(cases)('%s', (input) => {
				expect(() => parser.parse(input)).toThrowError();
			});
		});
	});

	describe('functions with arguments syntax', () => {
		describe('correct functions', () => {
			const cases = generateRandomStatementsFromTemplate(validFunctionsWithArgumentsExamples);
			it.each(cases)('%s', (input) => {
				assert.isOk(parser.parse(input));
			});
		});

		describe('incorrect functions', () => {
			const cases = generateRandomStatementsFromTemplate(invalidFunctionsWithArgumentsExamples);
			it.each(cases)('%s', (input) => {
				expect(() => parser.parse(input)).toThrowError();
			});
		});

		describe('multi-nested arguments as functions', () => {
			const cases = generateRandomStatementsFromTemplate(multiplyNestedFunctionsArguments, randomInteger(10, 25));
			it.each(cases)('%s', (input: string) => {
				assert.isOk(parser.parse(input));
			});
		});
	});

	describe('functions are correctly separated into types: string,decimal,integer etc', () => {
		functionCasesAndExpectedTypes.forEach((template) => {
			describe('function case', () => {
				const cases = generateExpressionCase(template);
				it.each(cases)('%s', (input: string, expectedDoc) => {
					const result = parser.parse(input);
					const ctx = getContextStatements(result)[0]!;
					const expr = ctx.items[0]!.defaultValue!;
					const expectedExpr = expectedDoc.statements[0]!.items[0]!.defaultValue!;

					expect(simplifyExpression(expr)).toStrictEqual(simplifyExpression(expectedExpr));
				});
			});
		});
	});

	describe('define statements', () => {
		it('should parse define with function expression', () => {
			const result = parser.parse('define/MyFunc(a, b) => Add(a, b)');
			const defines = getDefineStatements(result);
			expect(defines).toHaveLength(1);
			expect(defines[0]!.identifier).toBe('MyFunc');
		});

		it('should parse define with constant expression', () => {
			const result = parser.parse('define/MyConst() => %%someConst');
			const defines = getDefineStatements(result);
			expect(defines).toHaveLength(1);
		});

		it('should parse define with number expression', () => {
			const result = parser.parse('define/MyNum() => 42');
			const defines = getDefineStatements(result);
			expect(defines).toHaveLength(1);
		});
	});
});
