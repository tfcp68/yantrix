import { describe, expect, it } from 'vitest';
import {
	getContextStatements,
	getDefineStatements,
	getEmitStatements,
	getInjectStatements,
	getSubscribeStatements,
	hasByPass,
	hasInitialState,
	YantrixParser,
} from '../src';

describe('base grammar declarations', () => {
	const parser = new YantrixParser();

	describe('empty document', () => {
		it('should parse empty string', () => {
			const result = parser.parse('');
			expect(result.statements).toHaveLength(0);
			expect(hasInitialState(result)).toBe(false);
			expect(hasByPass(result)).toBe(false);
		});
	});

	describe('state markers', () => {
		it('should parse +Init marker', () => {
			const result = parser.parse('+Init');
			expect(hasInitialState(result)).toBe(true);
		});

		it('should parse +ByPass marker', () => {
			const result = parser.parse('+ByPass');
			expect(hasByPass(result)).toBe(true);
		});

		it('should parse both markers', () => {
			const result = parser.parse('+Init +ByPass');
			expect(hasInitialState(result)).toBe(true);
			expect(hasByPass(result)).toBe(true);
		});
	});

	describe('context statement creation', () => {
		it('should parse simple context statement', () => {
			const result = parser.parse('#{prop1}');
			const contexts = getContextStatements(result);
			expect(contexts).toHaveLength(1);
			expect(contexts[0]!.items).toHaveLength(1);
			expect(contexts[0]!.items[0]!.identifier).toBe('prop1');
		});

		it('should parse context with multiple items', () => {
			const result = parser.parse('#{prop1, prop2, prop3}');
			const contexts = getContextStatements(result);
			expect(contexts).toHaveLength(1);
			expect(contexts[0]!.items).toHaveLength(3);
		});

		it('should parse context with default value', () => {
			const result = parser.parse('#{prop1 = 42}');
			const contexts = getContextStatements(result);
			expect(contexts).toHaveLength(1);
			expect(contexts[0]!.items[0]!.identifier).toBe('prop1');
			expect(contexts[0]!.items[0]!.defaultValue).toBeDefined();
		});

		it('should parse context with reducer', () => {
			const result = parser.parse('#{prop1} <= $payload1');
			const contexts = getContextStatements(result);
			expect(contexts).toHaveLength(1);
			expect(contexts[0]!.reducer).toBeDefined();
			expect(contexts[0]!.reducer.length).toBeGreaterThan(0);
		});
	});

	describe('emit statement creation', () => {
		it('should parse simple emit statement', () => {
			const result = parser.parse('emit/EventName');
			const emits = getEmitStatements(result);
			expect(emits).toHaveLength(1);
			expect(emits[0]!.identifier).toBe('EventName');
		});

		it('should parse emit with meta', () => {
			const result = parser.parse('emit/EventName (#prop)');
			const emits = getEmitStatements(result);
			expect(emits).toHaveLength(1);
			expect(emits[0]!.identifier).toBe('EventName');
			expect(emits[0]!.meta.length).toBeGreaterThan(0);
		});
	});

	describe('subscribe statement creation', () => {
		it('should parse simple subscribe statement', () => {
			const result = parser.parse('subscribe/EventName ActionName');
			const subscribes = getSubscribeStatements(result);
			expect(subscribes).toHaveLength(1);
			expect(subscribes[0]!.identifier).toBe('EventName');
			expect(subscribes[0]!.actionName).toBe('ActionName');
		});

		it('should parse subscribe with payload', () => {
			const result = parser.parse('subscribe/EventName ActionName (#prop)');
			const subscribes = getSubscribeStatements(result);
			expect(subscribes).toHaveLength(1);
			expect(subscribes[0]!.payload.length).toBeGreaterThan(0);
		});
	});

	describe('define statement creation', () => {
		it('should parse define statement with no args', () => {
			const result = parser.parse('define/MyFunc() => 42');
			const defines = getDefineStatements(result);
			expect(defines).toHaveLength(1);
			expect(defines[0]!.identifier).toBe('MyFunc');
			expect(defines[0]!.args).toHaveLength(0);
		});

		it('should parse define statement with args', () => {
			const result = parser.parse('define/MyFunc(a, b) => Add(a, b)');
			const defines = getDefineStatements(result);
			expect(defines).toHaveLength(1);
			expect(defines[0]!.identifier).toBe('MyFunc');
			expect(defines[0]!.args).toHaveLength(2);
		});
	});

	describe('inject statement creation', () => {
		it('should parse inject statement', () => {
			const result = parser.parse('inject/MyFunction');
			const injects = getInjectStatements(result);
			expect(injects).toHaveLength(1);
			expect(injects[0]!.identifier).toBe('MyFunction');
		});
	});

	describe('expression statement creation', () => {
		it('should parse expression statement', () => {
			const result = parser.parse('=MyFunc($arg)?');
			expect(result.statements.length).toBeGreaterThan(0);
		});
	});

	describe('invalid statements should throw', () => {
		it('should throw on invalid syntax', () => {
			expect(() => parser.parse('invalid!@#')).toThrow();
		});
	});
});
