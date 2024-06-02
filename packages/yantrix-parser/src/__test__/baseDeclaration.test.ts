import { assert, describe, expect, test } from 'vitest';
import { YantrixParser } from '../yantrixParser.js';
import {
	baseContext,
	baseContextWithPrevious,
	baseEmitEvent,
	baseEmpty,
	baseSubscribe,
} from '../fixtures/baseDeclarations.js';
import { expressionProperties } from '../fixtures/expressions.js';
import { randomString, randomInteger, randomDecimal } from '@yantrix/utils';
import { ReservedList, SpecialCharList } from '../constants/index.js';

const invalidCases = [
	['#[LeftSideProperty]'],
	['#{LeftSideProperty} <='],
	['#{LeftSideProperty} =>'],
	['#{LeftSideProperty} ='],
	['#{LeftSideProperty'],
	['#{123LeftSideProperty'],
	['#{123}'],
	['#{!!LeftSideProperty}'],
	['#{LeftSideProperty!@#}'],
	['#{Left Side Property}'],
	['#{,LeftSideProperty'],
	['#{{LeftSideProperty} =>'],
	['#{LeftSideProperty} =>'],
	['#{}'],
	['#{} => ()'],
	['#{} => (RightSideProperty)'],
	['#(LeftSideProperty) <= {RightSideProperty}'],
	['#{LeftSideProperty = }'],
	['#{LeftSideProperty,}'],
	['#{LeftSideProperty = LeftSideProperty}'],
	['#{LeftSideProperty =} => (RightSideProperty=)'],
	['#{LeftSideProperty} => (RightSideProperty,)'],
	['#{LeftSideProperty} => (RightSideProperty)'],
	['#{LeftSideProperty} <= (Right Side Property)'],
	['#{Left1,Left2} <= (Right1, Right2, Right3)'],
	['#{Left1,Left2} <= (Right1, Right2, Right3=5)'],
	['#{Left1=1,Left2} <= (Right1, Right2, Right3)'],
	['#{Left1,Left2} => (Right1, Right2)'],
];

const base = [
	['', baseEmpty],
	['#{LeftSideProperty} <= (RightSideProperty)', baseContext],
	['#{LeftSideProperty} <= {RightSideProperty}', baseContextWithPrevious],
	['subscribe/event => action', baseSubscribe],
	['emit/event <= (keylist)', baseEmitEvent],
] as const;

describe('Base grammar declarations', () => {
	describe('Base constructs are created', () => {
		test.each(base)('%s', (input: any, res: any) => {
			const parser = new YantrixParser().parse(input as string);

			assert.deepOwnInclude(parser, res);
		});
	});
	describe('Identical output with ', () => {
		test('#{Left1, Left2} <= (Right1, Right2) = #{Left2, Left1} <= (Right2, Right1)', () => {
			const parser = new YantrixParser();
			const [left1, left2, right1, right2] = Array.apply(null, Array(4)).map(() => randomString());
			const parsedLeft = parser.parse(`#{${left1}, ${left2}} <= (${right1}, ${right2})`);
			const parsedRight = parser.parse(`#{${left2}, ${left1}} <= (${right2}, ${right1})`);
			const contextLeftDescription = parsedLeft.contextDescription[0];
			const contextRightDescription = parsedRight.contextDescription[0];

			const { context: contextLeft, payload: payloadLeft } = contextLeftDescription;
			const { context: contextRight, payload: payloadRight } = contextRightDescription;

			expect(contextLeft[0]).toStrictEqual(contextRight[1]);
			expect(contextLeft[1]).toStrictEqual(contextRight[0]);

			expect(payloadLeft[0]).toStrictEqual(payloadRight[1]);
			expect(payloadLeft[1]).toStrictEqual(payloadRight[0]);
		});

		test('#{Left1, Left2, Left3} <= (Right1, Right2) = #{Left2, Left1, Left3} <= (Right2, Right1)', () => {
			const parser = new YantrixParser();
			const [left1, left2, left3, right1, right2] = Array.apply(null, Array(5)).map(() => randomString());
			const parsedLeft = parser.parse(`#{${left1}, ${left2}, ${left3}} <= (${right1}, ${right2})`);
			const parsedRight = parser.parse(`#{${left2}, ${left1}, ${left3}} <= (${right2}, ${right1})`);
			const contextLeftDescription = parsedLeft.contextDescription[0];
			const contextRightDescription = parsedRight.contextDescription[0];

			const { context: contextLeft, payload: payloadLeft } = contextLeftDescription;
			const { context: contextRight, payload: payloadRight } = contextRightDescription;

			expect(contextLeft[0]).toStrictEqual(contextRight[1]);
			expect(contextLeft[1]).toStrictEqual(contextRight[0]);
			expect(contextLeft[2]).toStrictEqual(contextRight[2]);

			expect(payloadLeft[0]).toStrictEqual(payloadRight[1]);
			expect(payloadLeft[1]).toStrictEqual(payloadRight[0]);
			expect(payloadLeft[2]).toStrictEqual(payloadRight[2]);
		});
		test('#{Left1, Left2, Left3} = #{     Left1,	Left2      ,   Left3  }', () => {
			const parser = new YantrixParser();
			const [left1, left2, left3] = Array.apply(null, Array(3)).map(() => randomString());
			const parsedLeft = parser.parse(`#{${left1}, ${left2}, ${left3}}`);
			const parsedRight = parser.parse(`#{     ${left1},	${left2}      ,   ${left3}   }`);
			const contextLeftDescription = parsedLeft.contextDescription[0];
			const contextRightDescription = parsedRight.contextDescription[0];

			const { context: contextLeft, payload: payloadLeft } = contextLeftDescription;
			const { context: contextRight, payload: payloadRight } = contextRightDescription;

			contextLeft.forEach((el: any, index: any) => {
				expect(el).toMatchObject(contextRight[index]);
			});
		});
	});
	describe('Parser fails on invalid cases', () => {
		test.each(invalidCases)(' %s  ----- Error', (input) => {
			expect(() => new YantrixParser().parse(input)).toThrowError();
		});
	});

	describe('Context statement has correct format', () => {
		const parser = new YantrixParser();
		const propertyName = randomString();
		const correctStatement = `#{${propertyName}}`;
		const incorrectStatements = [
			...ReservedList.map((reservedWord) => `#{${reservedWord}}`),
			...SpecialCharList.map((char: string) => `${char}{${propertyName}}`),
			`#[${propertyName}]`,
			`#(${propertyName})`,
		];
		test.each(incorrectStatements)('%s -- ERROR', (input) => {
			expect(() => parser.parse(input)).toThrowError();
		});
		test(`${correctStatement} --- CORRECT`, () => {
			const result = parser.parse(correctStatement);
			assert.isOk(result);
		});
	});

	describe('Key item descriptor starts only with a letter', () => {
		const parser = new YantrixParser();
		const propertyName = randomString();
		const correctStatement = `#{${propertyName}}`;
		describe('Key item descriptor cannot start with or contain a special character', () => {
			const incorrectStatements = [
				...SpecialCharList.map((char: string) => `#{${char}${propertyName}}`),
				...SpecialCharList.map((char: string) => `#{${propertyName}${char}}`),
			];
			test.each(incorrectStatements)('%s --- ERROR', (input) => {
				expect(() => parser.parse(input)).toThrowError();
			});
			test(`${correctStatement} --- CORRECT`, () => {
				const result = parser.parse(correctStatement);
				assert.isOk(result);
			});
		});
		describe('Key item descriptor cannot start with a number, but can contain numbers afterwards', () => {
			const incorrectStatements = [...Array(10).keys()].map((number) => `#{${number}${propertyName}}`);
			const correctStatements = [...Array(10).keys()].map((number) => `#{${propertyName}${number}}`);
			test.each(incorrectStatements)('%s --- ERROR', (input) => {
				expect(() => parser.parse(input)).toThrowError();
			});
			test.each(correctStatements)('%s --- CORRECT', (input) => {
				assert.isOk(parser.parse(input));
			});
		});
		describe('Key item descriptor can start with lowercase and uppercase letters', () => {
			const uppercaseNameStatement = `#{${propertyName.toUpperCase()}}`;
			const lowercaseNameStatement = `#{${propertyName.toLowerCase()}}`;
			test(`${uppercaseNameStatement} --- CORRECT`, () => {
				const result = parser.parse(uppercaseNameStatement);
				assert.isOk(result);
			});
			test(`${lowercaseNameStatement} --- CORRECT`, () => {
				const result = parser.parse(lowercaseNameStatement);
				assert.isOk(result);
			});
		});
	});

	describe('Payload cannot have more arguments than the context', () => {
		const parser = new YantrixParser();
		for (let i = 0; i < 100; i++) {
			const contextArgumentCount = Math.ceil(Math.random() * 50);
			const payloadArgumentCount = Math.ceil(Math.random() * 100);
			const contextArguments = Array.apply(null, Array(contextArgumentCount))
				.map((v, i) => `prop${i}`)
				.join(',');
			const payloadArguments = Array.apply(null, Array(payloadArgumentCount))
				.map((v, i) => `prop${i}`)
				.join(',');
			const stringToParse = `#{${contextArguments}} <= (${payloadArguments})`;

			test(`context args: ${contextArgumentCount}, payload args: ${payloadArgumentCount}`, () => {
				if (contextArgumentCount >= payloadArgumentCount) {
					assert.isOk(parser.parse(stringToParse));
				} else {
					expect(() => parser.parse(stringToParse)).toThrowError();
				}
			});
		}
	});

	describe('Previous context cannot have more arguments than the current one', () => {
		const parser = new YantrixParser();
		for (let i = 0; i < 100; i++) {
			const contextArgumentCount = Math.ceil(Math.random() * 50);
			const prevContextArgumentCount = Math.ceil(Math.random() * 100);
			const contextArguments = Array.apply(null, Array(contextArgumentCount))
				.map((v, i) => `prop${i}`)
				.join(',');
			const prevContextArguments = Array.apply(null, Array(prevContextArgumentCount))
				.map((v, i) => `prop${i}`)
				.join(',');
			const stringToParse = `#{${contextArguments}} <= {${prevContextArguments}}`;

			test(`context args: ${contextArgumentCount}, prev.context args: ${prevContextArgumentCount}`, () => {
				if (contextArgumentCount >= prevContextArgumentCount) {
					assert.isOk(parser.parse(stringToParse));
				} else {
					expect(() => parser.parse(stringToParse)).toThrowError();
				}
			});
		}
	});

	describe('Expressions are created with the correct format', () => {
		const parser = new YantrixParser();
		const [arg, value] = [randomString(), randomString()];
		const correctString = `#{${arg} = ${value}}`;
		const incorrectStrings = [
			`#{${arg} - ${value}}`,
			`#{${arg}  ${value}}`,
			`#{${arg} == ${value}}`,
			`#{${arg} -> ${value}}`,
			`#{${arg} <- ${value}}`,
			`#{${arg} = {${value}}}`,
		];
		test(`${correctString} --- CORRECT`, () => {
			const result = parser.parse(correctString);
			assert.isOk(result.contextDescription[0].context[0].KeyItemDeclaration.Expression);
		});
		test.each(incorrectStrings)(`%s --- ERROR`, (input) => {
			expect(() => parser.parse(input)).toThrowError();
		});
	});

	describe('Expression values are separated into strings, integers, decimals, functions etc', () => {
		const parser = new YantrixParser();
		const [arg, stringVal, intVal, decimalVal, funcName, propName] = [
			randomString(),
			randomString(),
			randomInteger(),
			randomDecimal(),
			randomString(),
			randomString(),
		];
		test('Expression value is recognized as String', () => {
			const correctString = `#{${arg} ="${stringVal}"}`;
			const result = parser.parse(correctString);
			assert.deepNestedInclude(
				result.contextDescription[0].context[0].KeyItemDeclaration.Expression,
				expressionProperties.string(stringVal),
			);

			const extraCases = [
				[`#{${arg} ="${intVal}"}`, expressionProperties.string(intVal.toString())],
				[`#{${arg} ="${decimalVal}"}`, expressionProperties.string(decimalVal.toString())],
				[`#{${arg} ="[]"}`, expressionProperties.string('[]')],
			];
			extraCases.forEach((c) => {
				const result = parser.parse(c[0] as string);
				assert.deepNestedInclude(result.contextDescription[0].context[0].KeyItemDeclaration.Expression, c[1]);
			});
		});
		test('Expression value is recognized as Integer', () => {
			const correctString = `#{${arg} = ${intVal}}`;
			const result = parser.parse(correctString);
			assert.deepNestedInclude(
				result.contextDescription[0].context[0].KeyItemDeclaration.Expression,
				expressionProperties.integer(intVal),
			);
		});
		test('Expression value is recognized as Decimal', () => {
			const correctString = `#{${arg} = ${decimalVal}}`;
			const result = parser.parse(correctString);
			assert.deepNestedInclude(
				result.contextDescription[0].context[0].KeyItemDeclaration.Expression,
				expressionProperties.decimal(decimalVal),
			);
		});
		test('Expression value is recognized as Constant', () => {
			const correctString = `#{${arg} = $(${stringVal})}`;
			const result = parser.parse(correctString);
			assert.deepNestedInclude(
				result.contextDescription[0].context[0].KeyItemDeclaration.Expression,
				expressionProperties.constant(`$(${stringVal})`),
			);
		});
		test('Expression value is recognized as Array', () => {
			const correctString = `#{${arg} = []}`;
			const result = parser.parse(correctString);
			assert.deepNestedInclude(
				result.contextDescription[0].context[0].KeyItemDeclaration.Expression,
				expressionProperties.array(),
			);
		});
		test('Expression value is recognized as Function', () => {
			const correctString = `#{${arg} = ${funcName}()}`;
			const result = parser.parse(correctString);
			assert.deepNestedInclude(
				result.contextDescription[0].context[0].KeyItemDeclaration.Expression,
				expressionProperties.function(funcName),
			);
		});
		test('Expression value is recognized as Property', () => {
			const correctString = `#{${arg} = ${propName}}`;
			const result = parser.parse(correctString);
			assert.deepNestedInclude(
				result.contextDescription[0].context[0].KeyItemDeclaration.Expression,
				expressionProperties.property(propName),
			);
		});
	});

	describe('Array expression is created only with an empty array', () => {
		const parser = new YantrixParser();
		test('Empty array expression can be created', () => {
			const correctString = '#{arg = []}';
			const result = parser.parse(correctString);
			assert.deepNestedInclude(
				result.contextDescription[0].context[0].KeyItemDeclaration.Expression,
				expressionProperties.array(),
			);
		});
		test('Non-empty array expression cannot be created', () => {
			const incorrectStrings = [
				`#{arg=[${randomInteger}, ${randomInteger}, ${randomInteger}]}`,
				`#{arg=[${randomDecimal}, ${randomDecimal}, ${randomDecimal}]}`,
				`#{arg=[${randomString}, ${randomString}, ${randomString}]}`,
				`#{arg=[${randomString}(), ${randomString}()]}`,
				`#{arg=[${randomString}, ${randomString}]}`,
				`#{arg=["${randomString}", ${randomInteger}, ${randomDecimal}, ${randomString}(), ${randomString}]}`,
			];
			incorrectStrings.forEach((str) => expect(() => parser.parse(str)).toThrowError());
		});
	});

	describe('State transformer statement has correct format', () => {
		const parser = new YantrixParser();
		const [arg, val] = [randomString(), randomString()];
		const correctStrings = [`#{${arg}} <= (${val})`, `#{${arg}} <= {${val}}`];
		const incorrectStrings = [
			`#{${arg}} <= [${val}]`,
			`#{${arg}} <= ((${val}))`,
			`#{${arg}} <= {{${val}}}`,
			`#{{${arg}}} <= (${val})`,
			`#{${arg}} <== (${val})`,
			`#{${arg}} <<= (${val})`,
			`#{${arg}} <<== (${val})`,
			`#{${arg}} <- (${val})`,
			`#{${arg}} =< (${val})`,
			`#{${arg}} => (${val})`,
		];
		test.each(correctStrings)('%s --- CORRECT', (input) => assert.isOk(parser.parse(input)));
		test.each(incorrectStrings)('%s --- ERROR', (input) => expect(() => parser.parse(input)).toThrowError());
	});

	describe('Subscribe statements have correct format', () => {
		const parser = new YantrixParser();
		const eventName = `EVENT-${randomString()}`;
		const actionName = `ACTION-${randomString()}`;
		const keyList = ['idx1', 'idx2'];
		const correctStrings = [
			`subscribe/${eventName} => ${actionName}`,
			`subscribe/${eventName} => ${actionName} (${keyList.join(',')})`,
		];
		const correctString = `subscribe/${eventName} => ${actionName}`;
		const incorrectStrings = [
			`subscribe/${eventName}`,
			`subscrib/${eventName} => ${actionName}`,
			`subscrb/${eventName} => ${actionName}`,
			`subscribe\\${eventName} => ${actionName}`,
			`subscribe//${eventName} => ${actionName}`,
			`subscribe/ => ${actionName}`,
			`subscribe/ =>`,
			`subscribe/${eventName} =>`,
			`subscribe/${eventName} => ()`,
			`subscribe/${eventName} => {}`,
			`subscribe/${eventName} <= ${actionName}`,
			`subscribe/${eventName} => ${actionName} [${keyList.join(',')}]`,
			`subscribe/${eventName} => ${actionName} {${keyList.join(',')}}`,
			`subscribe/${eventName} => ${actionName} ()`,
		];
		test(`${correctString} --- CORRECT`, () => {
			assert.isOk(parser.parse(correctString));
		});
		test.each(incorrectStrings)(`%s --- ERROR`, (str) => expect(() => parser.parse(str)).toThrowError());
	});

	describe('Emit statements have correct format', () => {
		const parser = new YantrixParser();
		const eventName = `EVENT-${randomString()}`;
		const keyList = ['idx1', 'idx2'];
		const correctStrings = [`emit/${eventName} <= (${keyList.join(',')})`, `emit/${eventName}`];
		const incorrectStrings = [
			`emt/${eventName}`,
			`emit/${eventName} <= ${keyList.join(',')}`,
			`emit/${eventName} <= ()`,
			`emit/${eventName} <=`,
			`emit/${eventName} =>`,
			`emit/${eventName} <= {${keyList.join(',')}}`,
			`emit/${eventName} <= [${keyList.join(',')}]`,
			`emit/${eventName} => (${keyList.join(',')})`,
		];
		test.each(correctStrings)('%s --- CORRECT', (str) => assert.isOk(parser.parse(str)));
		test.each(incorrectStrings)(`%s --- ERROR`, (str) => expect(() => parser.parse(str)).toThrowError());
	});
});
