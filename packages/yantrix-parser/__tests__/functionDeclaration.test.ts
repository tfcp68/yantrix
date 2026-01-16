import { assert, describe, expect, it } from 'vitest';
import { getDefineStatements, YantrixParser } from '../src';

function randomString(): string {
	// Ensure the string starts with a letter (required by grammar)
	const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	const firstChar = letters[Math.floor(Math.random() * letters.length)];
	return firstChar + Math.random().toString(36).substring(2, 9);
}

function randomInteger(min = 0, max = 1000): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDecimal(min = 0, max = 1000): number {
	return Math.random() * (max - min) + min;
}

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
];

const invalidFunctionsWithArgumentsExamples = [
	'#{%s = %s (%s)}',
	'#{%s = (%s)}',
	'#{%s = %s[%s]}',
	'#{%s = %s{%s}}',
	'#{%s = %s($)}',
	'#{%s = %s(#)}',
	'#{%s = %s(%%)}',
];

/**
 * Generate random statements from templates
 */
function generateRandomStatementsFromTemplate(arr: string[], casesAmount: number = 10) {
	return arr.flatMap((template) => {
		return Array.from({ length: casesAmount }, () =>
			template
				.replaceAll('%i', () => randomInteger().toString())
				.replaceAll('%d', () => randomDecimal().toFixed(2))
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

describe('function declaration', () => {
	const parser = new YantrixParser();

	describe('function strings with random arguments', () => {
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
