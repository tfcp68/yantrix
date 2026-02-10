import { randomInteger, randomString } from '@yantrix/utils';
import { describe, expect, it } from 'vitest';
import {
	getContextStatements,
	getDefineStatements,
	getEmitStatements,
	getExpressionStatements,
	getExpressionType,
	getInjectStatements,
	getNumberValue,
	getReferenceIdentifier,
	getReferenceType,
	getStringValue,
	getSubscribeStatements,
	hasByPass,
	hasInitialState,
	isDataObject,
	isFunctionCall,
	isNumberLiteral,
	isStringLiteral,
	ReservedList,
	SpecialCharList,
	YantrixParser,
} from '../src';

function genFromTemplates(templates: string[], casesAmount: number): string[] {
	return templates.flatMap((t) => {
		return Array.from({ length: casesAmount }, () => {
			const s = () => randomString().replace(/\W/g, 'a') || 'a';
			const i = () => randomInteger(0, 10_000).toString();
			const d = () => `${randomInteger(0, 10_000)}.${randomInteger(0, 10_000)}`;

			return t
				.replaceAll('%i', () => i())
				.replaceAll('%d', () => d())
				.replaceAll('%s', () => s());
		});
	});
}

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
		const validContextStatements = ['#{%s}'];
		const invalidContextStatements = [
			...ReservedList.map(reservedWord => `#{${reservedWord}}`),
			...SpecialCharList.map((char: string) => `${char}{%s}`),
			'#[%s]',
			'#(%s)',
			'#{%s',
			'#{%s,}',
		];

		describe('correct statements', () => {
			const cases = genFromTemplates(validContextStatements, randomInteger(1, 10));
			it.each(cases)('%s --- CORRECT', (input) => {
				const result = parser.parse(input);
				expect(getContextStatements(result)).toHaveLength(1);
			});
		});

		describe('incorrect statements', () => {
			const cases = genFromTemplates(invalidContextStatements, randomInteger(1, 10));
			it.each(cases)('%s --- ERROR', (input) => {
				expect(() => parser.parse(input)).toThrowError();
			});
		});

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

	describe('base constructs creation', () => {
		it('parses "#{LeftSideProperty} <= #RightSideProperty"', () => {
			const result = parser.parse('#{LeftSideProperty} <= #RightSideProperty');
			const ctx = getContextStatements(result);
			expect(ctx).toHaveLength(1);
			expect(ctx[0]!.items.map(i => i.identifier)).toEqual(['LeftSideProperty']);
			expect(ctx[0]!.reducer).toHaveLength(1);

			const reducer0 = ctx[0]!.reducer[0]!;
			expect(isDataObject(reducer0)).toBe(true);
			if (isDataObject(reducer0)) {
				expect(getReferenceType(reducer0)).toBe('context');
				expect(getReferenceIdentifier(reducer0)).toBe('RightSideProperty');
			}
		});

		it('parses "#{LeftSideProperty} <= $RightSideProperty"', () => {
			const result = parser.parse('#{LeftSideProperty} <= $RightSideProperty');
			const ctx = getContextStatements(result);
			expect(ctx).toHaveLength(1);
			expect(ctx[0]!.items.map(i => i.identifier)).toEqual(['LeftSideProperty']);
			expect(ctx[0]!.reducer).toHaveLength(1);

			const reducer0 = ctx[0]!.reducer[0]!;
			expect(isDataObject(reducer0)).toBe(true);
			if (isDataObject(reducer0)) {
				expect(getReferenceType(reducer0)).toBe('payload');
				expect(getReferenceIdentifier(reducer0)).toBe('RightSideProperty');
			}
		});

		it('parses "emit/event (#t) <= #{ab}"', () => {
			const result = parser.parse('emit/event (#t) <= #{ab}');
			const emits = getEmitStatements(result);
			expect(emits).toHaveLength(1);

			const e = emits[0]!;
			expect(e.identifier).toBe('event');

			expect(e.meta).toHaveLength(1);
			expect(isDataObject(e.meta[0]!)).toBe(true);
			if (isDataObject(e.meta[0]!)) {
				expect(getReferenceType(e.meta[0]!)).toBe('context');
				expect(getReferenceIdentifier(e.meta[0]!)).toBe('t');
			}

			expect(e.context).toHaveLength(1);
			expect(e.context[0]!.identifier).toBe('ab');
		});
	});

	describe('identical output with', () => {
		it('#{Left1, Left2} <= #Right1, #Right2 is #{Left2, Left1} <= #Right2, #Right1', () => {
			const left1 = `L_${randomString().replace(/\W/g, 'a')}`;
			const left2 = `L_${randomString().replace(/\W/g, 'a')}`;
			const right1 = `R_${randomString().replace(/\W/g, 'a')}`;
			const right2 = `R_${randomString().replace(/\W/g, 'a')}`;

			const parsedLeft = parser.parse(`#{${left1}, ${left2}} <= $${right1}, $${right2}`);
			const parsedRight = parser.parse(`#{${left2}, ${left1}} <= $${right2}, $${right1}`);

			const ctxLeft = getContextStatements(parsedLeft)[0]!;
			const ctxRight = getContextStatements(parsedRight)[0]!;

			expect(ctxLeft.items[0]!.identifier).toBe(ctxRight.items[1]!.identifier);
			expect(ctxLeft.items[1]!.identifier).toBe(ctxRight.items[0]!.identifier);

			const l0 = ctxLeft.reducer[0]!;
			const l1 = ctxLeft.reducer[1]!;
			const r0 = ctxRight.reducer[0]!;
			const r1 = ctxRight.reducer[1]!;

			expect(isDataObject(l0) && isDataObject(r1)).toBe(true);
			expect(isDataObject(l1) && isDataObject(r0)).toBe(true);

			if (isDataObject(l0) && isDataObject(r1)) {
				expect(getReferenceType(l0)).toBe('payload');
				expect(getReferenceType(r1)).toBe('payload');
				expect(getReferenceIdentifier(l0)).toBe(getReferenceIdentifier(r1));
			}
			if (isDataObject(l1) && isDataObject(r0)) {
				expect(getReferenceType(l1)).toBe('payload');
				expect(getReferenceType(r0)).toBe('payload');
				expect(getReferenceIdentifier(l1)).toBe(getReferenceIdentifier(r0));
			}
		});

		it('#{Left1, Left2, Left3} <= (Right1, Right2) = #{Left2, Left1, Left3} <= (Right2, Right1)', () => {
			const [left1, left2, left3] = Array.from({ length: 3 }, () => `L_${randomString().replace(/\W/g, 'a')}`);
			const [right1, right2] = Array.from({ length: 2 }, () => `R_${randomString().replace(/\W/g, 'a')}`);

			const parsedLeft = parser.parse(`#{${left1}, ${left2}, ${left3}} <= $${right1}, $${right2}`);
			const parsedRight = parser.parse(`#{${left2}, ${left1}, ${left3}} <= $${right2}, $${right1}`);

			const ctxLeft = getContextStatements(parsedLeft)[0]!;
			const ctxRight = getContextStatements(parsedRight)[0]!;

			expect(ctxLeft.items[0]!.identifier).toBe(ctxRight.items[1]!.identifier);
			expect(ctxLeft.items[1]!.identifier).toBe(ctxRight.items[0]!.identifier);
			expect(ctxLeft.items[2]!.identifier).toBe(ctxRight.items[2]!.identifier);

			// Only 2 reducer items exist; they should be swapped accordingly
			expect(ctxLeft.reducer).toHaveLength(2);
			expect(ctxRight.reducer).toHaveLength(2);

			const l0 = ctxLeft.reducer[0]!;
			const l1 = ctxLeft.reducer[1]!;
			const r0 = ctxRight.reducer[0]!;
			const r1 = ctxRight.reducer[1]!;

			if (isDataObject(l0) && isDataObject(r1)) {
				expect(getReferenceIdentifier(l0)).toBe(getReferenceIdentifier(r1));
			}
			if (isDataObject(l1) && isDataObject(r0)) {
				expect(getReferenceIdentifier(l1)).toBe(getReferenceIdentifier(r0));
			}
		});

		it('#{Left1, Left2, Left3} = #{     Left1,	Left2      ,   Left3  }', () => {
			const [left1, left2, left3] = Array.from({ length: 3 }, () => `L_${randomString().replace(/\W/g, 'a')}`);
			const parsedLeft = parser.parse(`#{${left1}, ${left2}, ${left3}}`);
			const parsedRight = parser.parse(`#{     ${left1},\t${left2}      ,   ${left3}   }`);

			const ctxLeft = getContextStatements(parsedLeft)[0]!;
			const ctxRight = getContextStatements(parsedRight)[0]!;

			expect(ctxLeft.items.map(i => i.identifier)).toEqual(ctxRight.items.map(i => i.identifier));
		});
	});

	describe('argument count comparisons', () => {
		it('payload/reducer cannot have more arguments than the context (=> throw)', () => {
			const makeCase = () => {
				const ctxCount = randomInteger(1, 6);
				const reducerCount = ctxCount + randomInteger(1, 6);

				const ctxArgs = Array.from({ length: ctxCount }, (_, i) => `p${i}`).join(',');
				const reducerArgs = Array.from({ length: reducerCount }, (_, i) => `$r${i}`).join(',');

				return `#{${ctxArgs}} <= ${reducerArgs}`;
			};

			const cases = Array.from({ length: 25 }, () => makeCase());
			for (const c of cases) {
				expect(() => parser.parse(c)).toThrowError();
			}
		});

		it('context can have the same or more arguments than the reducer (=> ok)', () => {
			const makeCase = () => {
				const reducerCount = randomInteger(1, 6);
				const ctxCount = reducerCount + randomInteger(0, 6);

				const ctxArgs = Array.from({ length: ctxCount }, (_, i) => `p${i}`).join(',');
				const reducerArgs = Array.from({ length: reducerCount }, (_, i) => `$r${i}`).join(',');

				return `#{${ctxArgs}} <= ${reducerArgs}`;
			};

			const cases = Array.from({ length: 25 }, () => makeCase());
			for (const c of cases) {
				expect(() => parser.parse(c)).not.toThrow();
			}
		});
	});

	describe('expression creation', () => {
		const validExpressionDefaultValues = [
			`#{%s = #%s}`,
			`#{%s = '%s'}`,
			`#{%s = $%s}`,
			`#{%s = %%%s}`,
			`#{%s = []}`,
			`#{%s = '%i'}`,
			`#{%s = '%d'}`,
		];

		describe('correct expressions', () => {
			const cases = genFromTemplates(validExpressionDefaultValues, 25);
			it.each(cases)('%s --- CORRECT', (input) => {
				const result = parser.parse(input);
				const ctx = getContextStatements(result)[0]!;
				expect(ctx.items).toHaveLength(1);
				expect(ctx.items[0]!.defaultValue).toBeDefined();
			});
		});

		describe('incorrect expressions', () => {
			const invalidExpressionDefaultValues = [
				`#{%s - %s}`,
				`#{%s  %s}`,
				`#{%s == %s}`,
				`#{%s -> %s}`,
				`#{%s <- %s}`,
			];
			const cases = genFromTemplates(invalidExpressionDefaultValues, 10);
			it.each(cases)('%s --- ERROR', (input) => {
				expect(() => parser.parse(input)).toThrowError();
			});
		});

		it('array expression: empty array allowed', () => {
			const key = `k_${randomString().replace(/\W/g, 'a')}`;
			const result = parser.parse(`#{${key} = []}`);
			const ctx = getContextStatements(result)[0]!;
			const expr = ctx.items[0]!.defaultValue!;
			expect(getExpressionType(expr)).toBe('array');
		});

		it('array expression: non-empty array forbidden (should throw)', () => {
			expect(() => parser.parse(`#{arr = [1,2,3]}`)).toThrowError();
		});
	});

	describe('expression values are separated into strings, integers, decimals, functions etc', () => {
		it('string literal defaultValue', () => {
			const result = parser.parse(`#{a = "hello"}`);
			const expr = getContextStatements(result)[0]!.items[0]!.defaultValue!;
			expect(isStringLiteral(expr)).toBe(true);
			if (isStringLiteral(expr)) expect(getStringValue(expr)).toBe('hello');
		});

		it('integer literal defaultValue', () => {
			const result = parser.parse(`#{a = 42}`);
			const expr = getContextStatements(result)[0]!.items[0]!.defaultValue!;
			expect(isNumberLiteral(expr)).toBe(true);
			if (isNumberLiteral(expr)) expect(getNumberValue(expr)).toBe(42);
			expect(getExpressionType(expr)).toBe('integer');
		});

		it('decimal literal defaultValue', () => {
			const result = parser.parse(`#{a = 3.14}`);
			const expr = getContextStatements(result)[0]!.items[0]!.defaultValue!;
			expect(isNumberLiteral(expr)).toBe(true);
			expect(getExpressionType(expr)).toBe('decimal');
		});

		it('constant reference defaultValue', () => {
			const result = parser.parse(`#{a = %%PI}`);
			const expr = getContextStatements(result)[0]!.items[0]!.defaultValue!;
			expect(isDataObject(expr)).toBe(true);
			if (isDataObject(expr)) {
				expect(getReferenceType(expr)).toBe('constant');
				expect(getReferenceIdentifier(expr)).toBe('PI');
			}
		});

		it('context reference defaultValue', () => {
			const result = parser.parse(`#{a = #prev}`);
			const expr = getContextStatements(result)[0]!.items[0]!.defaultValue!;
			expect(isDataObject(expr)).toBe(true);
			if (isDataObject(expr)) {
				expect(getReferenceType(expr)).toBe('context');
				expect(getReferenceIdentifier(expr)).toBe('prev');
			}
		});

		it('payload reference defaultValue', () => {
			const result = parser.parse(`#{a = $p}`);
			const expr = getContextStatements(result)[0]!.items[0]!.defaultValue!;
			expect(isDataObject(expr)).toBe(true);
			if (isDataObject(expr)) {
				expect(getReferenceType(expr)).toBe('payload');
				expect(getReferenceIdentifier(expr)).toBe('p');
			}
		});

		it('function defaultValue', () => {
			const result = parser.parse(`#{a = sum($p, #q, 1)}`);
			const expr = getContextStatements(result)[0]!.items[0]!.defaultValue!;
			expect(isFunctionCall(expr)).toBe(true);
			if (isFunctionCall(expr)) {
				expect(expr.name).toBe('sum');
				expect(expr.args.length).toBeGreaterThanOrEqual(1);
			}
		});
	});

	describe('state transformer creation', () => {
		const validStateTransformerStatements = [`#{%s} <= #%s`, '#{%s} <= $%s'];
		const invalidStateTransformerStatements = [
			`#{%s} <= ((%s))`,
			`#{%s} <= {{%s}}`,
			`#{{%s}} <= (%s)`,
			`#{%s} <== (%s)`,
			`#{%s} <<= (%s)`,
			`#{%s} <<== (%s)`,
			`#{%s} <- (%s)`,
			`#{%s} =< (%s)`,
			`#{%s} => (%s)`,
		];

		describe('correct statements', () => {
			const cases = genFromTemplates(validStateTransformerStatements, 25);
			it.each(cases)('%s --- CORRECT', (input) => {
				expect(() => parser.parse(input)).not.toThrow();
			});
		});

		describe('incorrect statements', () => {
			const cases = genFromTemplates(invalidStateTransformerStatements, 25);
			it.each(cases)('%s --- ERROR', (input) => {
				expect(() => parser.parse(input)).toThrowError();
			});
		});
	});

	describe('emit statements creation', () => {
		const validEmitStatements = [`emit/%s`, `emit/%s (#%s)`, 'emit/%s (#%s) <= #{%s}'];
		const invalidEmitStatements = [
			`emt/%s`,
			`emit/%s <= %s`,
			`emit/%s <= ()`,
			`emit/%s <=`,
			`emit/%s =>`,
			`emit/%s <= {%s}`,
			`emit/%s <= [%s]`,
			`emit/%s => (%s)`,
		];

		describe('correct statements', () => {
			const cases = genFromTemplates(validEmitStatements, 25);
			it.each(cases)('%s --- CORRECT', (str) => {
				const doc = parser.parse(str);
				expect(getEmitStatements(doc).length).toBeGreaterThanOrEqual(1);
			});
		});

		describe('incorrect statements', () => {
			const cases = genFromTemplates(invalidEmitStatements, 25);
			it.each(cases)('%s --- ERROR', (str) => {
				expect(() => parser.parse(str)).toThrowError();
			});
		});
	});

	describe('subscribe statements creation', () => {
		const validSubscribeStatements = [
			'subscribe/%s %s',
			'subscribe/%s %s (#%s)',
			'subscribe/%s %s (#%s) <= (#%s)',
		];

		const invalidSubscribeStatements = [
			`%s/%s => %s`,
			`subscribe\\%s => %s`,
			'subscribe/%s',
			'subscribe/%s ()',
			'subscribe/%s %s ()',
			`subscribe//%s => %s`,
			`subscribe/ => %s`,
			`subscribe/%s => `,
			`subscribe/%s => ()`,
			`subscribe/%s => {}`,
			`subscribe/%s <= %s`,
			`subscribe/%s => %s [%s]`,
			`subscribe/%s => %s {%s}`,
			`subscribe/%s <= %s ()`,
		];

		describe('correct statements', () => {
			const cases = genFromTemplates(validSubscribeStatements, 25);
			it.each(cases)('%s --- CORRECT', (input) => {
				const doc = parser.parse(input);
				expect(getSubscribeStatements(doc).length).toBeGreaterThanOrEqual(1);
			});
		});

		describe('incorrect statements', () => {
			const cases = genFromTemplates(invalidSubscribeStatements, 25);
			it.each(cases)('%s --- ERROR', (input) => {
				expect(() => parser.parse(input)).toThrowError();
			});
		});
	});

	describe('expression statements creation', () => {
		const validExpressionStatements = [
			'=%s($%s, #%s)?',
			'=%s(%s($%s, %i))?',
		];
		const invalidExpressionStatements = [
			'%s($%s, #%s)',
			'%s($%s, #%s)?',
			'=%s($%s, #%s)',
		];

		describe('correct statements', () => {
			const cases = genFromTemplates(validExpressionStatements, 10);
			it.each(cases)('%s --- CORRECT', (str) => {
				const doc = parser.parse(str);
				expect(getExpressionStatements(doc).length).toBe(1);
			});
		});

		describe('incorrect statements', () => {
			const cases = genFromTemplates(invalidExpressionStatements, 10);
			it.each(cases)('%s --- ERROR', (str) => {
				expect(() => parser.parse(str)).toThrowError();
			});
		});
	});
});
