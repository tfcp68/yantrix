import { describe, expect, it } from 'vitest';
import { getContextStatements, YantrixParser } from '../src';

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
			const contexts = getContextStatements(result);
			expect(contexts[0]!.items[0]!.identifier).toBe('prop1');
			expect(contexts[0]!.items[0]!.defaultValue).toBeDefined();
		});

		it('should parse key item with integer default', () => {
			const result = parser.parse('#{prop1 = 42}');
			const contexts = getContextStatements(result);
			expect(contexts[0]!.items[0]!.defaultValue).toBeDefined();
		});

		it('should parse key item with decimal default', () => {
			const result = parser.parse('#{prop1 = 3.14}');
			const contexts = getContextStatements(result);
			expect(contexts[0]!.items[0]!.defaultValue).toBeDefined();
		});

		it('should parse key item with array default', () => {
			const result = parser.parse('#{prop1 = []}');
			const contexts = getContextStatements(result);
			expect(contexts[0]!.items[0]!.defaultValue).toBeDefined();
		});

		it('should parse key item with context reference default', () => {
			const result = parser.parse('#{prop1 = #otherProp}');
			const contexts = getContextStatements(result);
			expect(contexts[0]!.items[0]!.defaultValue).toBeDefined();
		});

		it('should parse key item with payload reference default', () => {
			const result = parser.parse('#{prop1 = $payload}');
			const contexts = getContextStatements(result);
			expect(contexts[0]!.items[0]!.defaultValue).toBeDefined();
		});

		it('should parse key item with constant reference default', () => {
			const result = parser.parse('#{prop1 = %%MY_CONST}');
			const contexts = getContextStatements(result);
			expect(contexts[0]!.items[0]!.defaultValue).toBeDefined();
		});

		it('should parse key item with function default', () => {
			const result = parser.parse('#{prop1 = MyFunc()}');
			const contexts = getContextStatements(result);
			expect(contexts[0]!.items[0]!.defaultValue).toBeDefined();
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
	});
});
