import { randomInteger, randomString } from '@yantrix/utils';
import { describe, expect, it } from 'vitest';
import {
	getContextStatements,
	getExpressionType,
	getNumberValue,
	getReferenceIdentifier,
	getReferenceType,
	getStringValue,
	isDataObject,
	isFunctionCall,
	isNumberLiteral,
	isStringLiteral,
	YantrixParser,
} from '../src';

function genFromTemplates(templates: string[], casesAmount: number): string[] {
	return templates.flatMap((t) => {
		return Array.from({ length: casesAmount }, () => {
			const id = () => randomString(); // already valid ID (letters only)
			const intStr = () => randomInteger(0, 10_000).toString();
			const decStr = () => `${randomInteger(0, 10_000)}.${randomInteger(0, 10_000)}`;
			const str = () => randomString();

			return t
				.replaceAll('%ID', () => id())
				.replaceAll('%INT', () => intStr())
				.replaceAll('%DEC', () => decStr())
				.replaceAll('%STR', () => str())
				.replaceAll('%CTX', () => id())
				.replaceAll('%PAY', () => id())
				.replaceAll('%FN', () => id())
				.replaceAll('%CST', () => id());
		});
	});
}

describe('key list', () => {
	const parser = new YantrixParser();

	describe('single key item', () => {
		it('should parse simple key item', () => {
			const result = parser.parse('#{prop1}');
			const contexts = getContextStatements(result);
			expect(contexts).toHaveLength(1);
			expect(contexts[0]!.items[0]!.identifier).toBe('prop1');
		});

		it('should parse key item with string default', () => {
			const result = parser.parse('#{prop1 = "hello"}');
			const item = getContextStatements(result)[0]!.items[0]!;
			expect(item.identifier).toBe('prop1');
			expect(item.defaultValue).toBeDefined();

			const expr = item.defaultValue!;
			expect(isStringLiteral(expr)).toBe(true);
			if (isStringLiteral(expr)) expect(getStringValue(expr)).toBe('hello');
			expect(getExpressionType(expr)).toBe('string');
		});

		it('should parse key item with integer default', () => {
			const result = parser.parse('#{prop1 = 42}');
			const expr = getContextStatements(result)[0]!.items[0]!.defaultValue!;
			expect(isNumberLiteral(expr)).toBe(true);
			if (isNumberLiteral(expr)) expect(getNumberValue(expr)).toBe(42);
			expect(getExpressionType(expr)).toBe('integer');
		});

		it('should parse key item with decimal default', () => {
			const result = parser.parse('#{prop1 = 3.14}');
			const expr = getContextStatements(result)[0]!.items[0]!.defaultValue!;
			expect(isNumberLiteral(expr)).toBe(true);
			expect(getExpressionType(expr)).toBe('decimal');
		});

		it('should parse key item with array default', () => {
			const result = parser.parse('#{prop1 = []}');
			const expr = getContextStatements(result)[0]!.items[0]!.defaultValue!;
			expect(getExpressionType(expr)).toBe('array');
		});

		it('should parse key item with context reference default', () => {
			const result = parser.parse('#{prop1 = #otherProp}');
			const expr = getContextStatements(result)[0]!.items[0]!.defaultValue!;
			expect(isDataObject(expr)).toBe(true);
			if (isDataObject(expr)) {
				expect(getReferenceType(expr)).toBe('context');
				expect(getReferenceIdentifier(expr)).toBe('otherProp');
			}
		});

		it('should parse key item with payload reference default', () => {
			const result = parser.parse('#{prop1 = $payload}');
			const expr = getContextStatements(result)[0]!.items[0]!.defaultValue!;
			expect(isDataObject(expr)).toBe(true);
			if (isDataObject(expr)) {
				expect(getReferenceType(expr)).toBe('payload');
				expect(getReferenceIdentifier(expr)).toBe('payload');
			}
		});

		it('should parse key item with constant reference default', () => {
			const result = parser.parse('#{prop1 = %%MY_CONST}');
			const expr = getContextStatements(result)[0]!.items[0]!.defaultValue!;
			expect(isDataObject(expr)).toBe(true);
			if (isDataObject(expr)) {
				expect(getReferenceType(expr)).toBe('constant');
				expect(getReferenceIdentifier(expr)).toBe('MY_CONST');
			}
		});

		it('should parse key item with function default', () => {
			const result = parser.parse('#{prop1 = MyFunc()}');
			const expr = getContextStatements(result)[0]!.items[0]!.defaultValue!;
			expect(isFunctionCall(expr)).toBe(true);
			if (isFunctionCall(expr)) {
				expect(expr.name).toBe('MyFunc');
				expect(expr.args).toHaveLength(0);
			}
		});

		it('should throw if there is whitespace between function name and "(" in key item default value', () => {
			expect(() => parser.parse('#{prop1 = MyFunc ()}')).toThrow();
		});
	});

	describe('multiple key items', () => {
		it('should parse multiple key items', () => {
			const result = parser.parse('#{prop1, prop2, prop3}');
			const contexts = getContextStatements(result);
			expect(contexts[0]!.items).toHaveLength(3);
		});

		it('should parse multiple key items with defaults', () => {
			const result = parser.parse('#{prop1 = 1, prop2 = 2, prop3 = 3}');
			const contexts = getContextStatements(result);
			expect(contexts[0]!.items).toHaveLength(3);
			contexts[0]!.items.forEach((item) => {
				expect(item.defaultValue).toBeDefined();
			});
		});

		it('should parse mixed key items (with and without defaults)', () => {
			const result = parser.parse('#{prop1 = 1, prop2, prop3 = 3}');
			const contexts = getContextStatements(result);
			expect(contexts[0]!.items).toHaveLength(3);
			expect(contexts[0]!.items[0]!.defaultValue).toBeDefined();
			expect(contexts[0]!.items[1]!.defaultValue).toBeUndefined();
			expect(contexts[0]!.items[2]!.defaultValue).toBeDefined();
		});

		describe('many items of the same type', () => {
			const typeTemplates: Array<{ name: string; template: string; expected: ReturnType<typeof getExpressionType> }> = [
				{ name: 'string', template: '#{%ID = "%STR"}', expected: 'string' },
				{ name: 'integer', template: '#{%ID = %INT}', expected: 'integer' },
				{ name: 'decimal', template: '#{%ID = %DEC}', expected: 'decimal' },
				{ name: 'array', template: '#{%ID = []}', expected: 'array' },
				{ name: 'contextRef', template: '#{%ID = #%CTX}', expected: 'context' },
				{ name: 'payloadRef', template: '#{%ID = $%PAY}', expected: 'payload' },
				{ name: 'constantRef', template: '#{%ID = %%%CST}', expected: 'constant' },
				{ name: 'function', template: '#{%ID = %FN()}', expected: 'function' },
			];

			for (const { name, template, expected } of typeTemplates) {
				it(`${name}: parses many items and preserves expression types`, () => {
					for (let round = 0; round < 50; round++) {
						const count = randomInteger(1, 30);
						const parts = genFromTemplates([template], count).map(s => s.slice(2, -1));
						const input = `#{${parts.join(', ')}}`;

						const doc = parser.parse(input);
						const ctx = getContextStatements(doc)[0]!;

						expect(ctx.items).toHaveLength(count);

						for (const item of ctx.items) {
							expect(item.defaultValue).toBeDefined();
							expect(getExpressionType(item.defaultValue!)).toBe(expected);
						}
					}
				});
			}
		});

		describe('many items of different types', () => {
			it('parses mixed defaults (string/int/dec/array/refs/function) in one context', () => {
				const templates = [
					'%ID = "%STR"',
					'%ID = %INT',
					'%ID = %DEC',
					'%ID = []',
					'%ID = #%CTX',
					'%ID = $%PAY',
					'%ID = %%%CST',
					'%ID = %FN()',
				];

				for (let round = 0; round < 25; round++) {
					const count = randomInteger(5, 20);

					const parts = Array.from({ length: count }, () => {
						const t = templates[randomInteger(0, templates.length - 1)]!;
						return genFromTemplates([t], 1)[0]!;
					});

					const input = `#{${parts.join(', ')}}`;

					const doc = parser.parse(input);
					const ctx = getContextStatements(doc)[0]!;
					expect(ctx.items).toHaveLength(count);

					for (const item of ctx.items) {
						expect(item.identifier.length).toBeGreaterThan(0);
						expect(item.defaultValue).toBeDefined();
					}
				}
			});
		});

		describe('empty default value at the end (identifier-only item)', () => {
			it('last item has no defaultValue', () => {
				for (let round = 0; round < 20; round++) {
					const parts = genFromTemplates(['%ID = %INT', '%ID = "%STR"', '%ID = []'], randomInteger(1, 10));
					const last = randomString();
					const input = `#{${parts.join(', ')}, ${last}}`;

					const doc = parser.parse(input);
					const ctx = getContextStatements(doc)[0]!;
					expect(ctx.items.at(-1)!.identifier).toBe(last);
					expect(ctx.items.at(-1)!.defaultValue).toBeUndefined();
				}
			});

			it('multiple trailing identifier-only items have no defaultValue', () => {
				for (let round = 0; round < 20; round++) {
					const withDefaults = genFromTemplates(['%ID = %INT', '%ID = "%STR"'], randomInteger(1, 10));
					const emptyItems = Array.from({ length: randomInteger(1, 10) }, () => randomString());

					const input = `#{${withDefaults.join(', ')}, ${emptyItems.join(', ')}}`;
					const doc = parser.parse(input);
					const ctx = getContextStatements(doc)[0]!;

					const trailing = ctx.items.slice(withDefaults.length);
					expect(trailing).toHaveLength(emptyItems.length);
					for (let i = 0; i < emptyItems.length; i++) {
						expect(trailing[i]!.identifier).toBe(emptyItems[i]);
						expect(trailing[i]!.defaultValue).toBeUndefined();
					}
				}
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

	describe('invalid inputs', () => {
		it('should throw on trailing comma', () => {
			expect(() => parser.parse('#{prop1,}')).toThrow();
		});

		it('should throw on leading comma', () => {
			expect(() => parser.parse('#{,prop1}')).toThrow();
		});

		it('should throw on double comma', () => {
			expect(() => parser.parse('#{prop1,,prop2}')).toThrow();
		});

		it('should throw on empty value after "="', () => {
			expect(() => parser.parse('#{prop1 = }')).toThrow();
		});

		it('should throw on invalid identifier characters (e.g. "pro-p")', () => {
			expect(() => parser.parse('#{pro-p = 1}')).toThrow();
		});
	});
});
