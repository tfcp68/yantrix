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

const getRandomValueFunction = () => {
	const randomValueFunctions = [randomString, randomInteger, randomDecimal];
	const randomIndex = Math.random() * randomValueFunctions.length;
	return randomValueFunctions[randomIndex];
};
const getRandomValue = () => getRandomValueFunction();
const getRandomArray = (valueType: () => any, amount: number = randomInteger()) => new Array(amount).map(valueType);

const validStateTransformerStatements = [`#{%s} <= (%s)`, `#{%s} <= {%s}`];
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
const generateStateTransformerStatement = () => {};

const validSubscribeStatements = [];
const invalidSubscribeStatements = [
	`%s/%s => %s`,
	`subscribe/%s`,
	`subscribe\\%s => %s`,
	`subscribe//%s => %s`,
	`subscribe/ => %s`,
	`subscribe/%s => `,
	`subscribe/%s => ()`,
	`subscribe/%s => {}`,
	`subscribe/%s => []`,
	`subscribe/%s <= %s`,
	`subscribe/%s => %s [%arr]`,
	`subscribe/%s => %s {%arr}`,
	`subscribe/%s <= %s ()`,
];
const generateSubscribeStatement = () => {};

const validEmitStatements = [`emit/%s <= (%arr)`, `emit/%s`];
const invalidEmitStatements = [
	`emt/%s`,
	`emit/%s <= %arr`,
	`emit/%s <= ()`,
	`emit/%s <=`,
	`emit/%s =>`,
	`emit/%s <= {%arr}`,
	`emit/%s <= [%arr]`,
	`emit/%s => (%arr)`,
];
const generateEmitStatement = () => {};

describe('Base grammar declarations', () => {
	describe('Base constructs creation', () => {
		const base = [
			['', baseEmpty],
			['#{LeftSideProperty} <= (RightSideProperty)', baseContext],
			['#{LeftSideProperty} <= {RightSideProperty}', baseContextWithPrevious],
			['subscribe/event => action', baseSubscribe],
			['emit/event <= (keylist)', baseEmitEvent],
		] as const;
		test.each(base)('%s', (input: any, res: any) => {
			const parser = new YantrixParser().parse(input as string);

			assert.deepOwnInclude(parser, res);
		});
	});
	describe('Identical output with ', () => {
		test('#{Left1, Left2} <= (Right1, Right2) = #{Left2, Left1} <= (Right2, Right1)', () => {
			const parser = new YantrixParser();
			const [left1, left2, right1, right2] = new Array(4).map(() => randomString());
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
			const [left1, left2, left3, right1, right2] = new Array(5).map(() => randomString());
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
			const [left1, left2, left3] = new Array(3).map(() => randomString());
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
	// describe.skip('Parser fails on invalid cases', () => {
	// 	test.each(invalidCases)(' %s  ----- Error', (input) => {
	// 		expect(() => new YantrixParser().parse(input)).toThrowError();
	// 	});
	// });

	// todo
	describe('Context statement creation', () => {
		const parser = new YantrixParser();

		describe('Correct statements', () => {
			const cases = new Array(1000).map(() => `#{${randomString()}}`);
			test.each(cases)('%s --- CORRECT', (input) => {
				const result = parser.parse(input);
				assert.isOk(result);
			});
		});

		describe('Incorrect statements', () => {
			const incorrectStatements = [
				...ReservedList.map((reservedWord) => `#{${reservedWord}}`),
				...SpecialCharList.map((char: string) => `${char}{${randomString()}}`),
				...Array(1000).map(() => `#[${randomString()}]`),
				...Array(1000).map(() => `#(${randomString()})`),
			];
			test.each(incorrectStatements)('%s -- ERROR', (input) => {
				expect(() => parser.parse(input)).toThrowError();
			});
		});
	});

	describe('Key item descriptor creation', () => {
		const parser = new YantrixParser();

		describe('Key item descriptor cannot start with or contain a special character', () => {
			const incorrectStatements = [
				...SpecialCharList.map((char: string) => `#{${char}${randomString()}}`),
				...SpecialCharList.map((char: string) => `#{${randomString()}${char}}`),
			];
			test.each(incorrectStatements)('%s --- ERROR', (input) => {
				expect(() => parser.parse(input)).toThrowError();
			});
		});

		describe('Key item descriptor cannot start with a number', () => {
			const incorrectStatements = [...Array(10).keys()].map((number) => `#{${number}${randomString()}}`);
			test.each(incorrectStatements)('%s --- ERROR', (input) => {
				expect(() => parser.parse(input)).toThrowError();
			});
		});

		describe('Key item descriptor can contain numbers after the first symbol', () => {
			const correctStatements = [...Array(10).keys()].map((number) => `#{${randomString()}${number}}`);
			test.each(correctStatements)('%s --- CORRECT', (input) => {
				assert.isOk(parser.parse(input));
			});
		});

		// todo
		describe('Key item descriptor can contain a number after the first symbol', () => {});

		describe('Key item descriptor can start with lowercase and uppercase letters', () => {
			const cases = Array(1000).map(() =>
				Math.random() < 0.5 ? randomString().toUpperCase() : randomString().toLowerCase(),
			);
			test.each(cases)('%s --- CORRECT', (input) => {
				const result = parser.parse(input);
				assert.isOk(result);
			});
		});
	});

	describe('Argument count comparisons', () => {
		describe('Payload cannot have more arguments than the context', () => {
			const parser = new YantrixParser();
			const generateCase = (contextArgumentMaxCount: number) => {
				const contextArgumentCount = Math.ceil(Math.random() * contextArgumentMaxCount);
				const payloadArgumentCount = contextArgumentCount + randomInteger();
				const contextArguments = Array(contextArgumentCount)
					.map((v, i) => `prop${i}`)
					.join(',');
				const payloadArguments = Array(payloadArgumentCount)
					.map((v, i) => `prop${i}`)
					.join(',');
				const stringToParse = `#{${contextArguments}} <= (${payloadArguments})`;
				return stringToParse;
			};
			const cases = Array(1000).map(() => generateCase(randomInteger()));
			test.each(cases)('%s --- ERROR', (input) => {
				expect(() => parser.parse(input)).toThrowError();
			});
		});

		describe('Context can have the same or more arguments than the payload', () => {
			const parser = new YantrixParser();
			const generateCase = (payloadArgumentMaxCount: number) => {
				const payloadArgumentCount = Math.ceil(Math.random() * payloadArgumentMaxCount);
				const contextArgumentCount = payloadArgumentCount + randomInteger();
				const contextArguments = Array(contextArgumentCount)
					.map((v, i) => `prop${i}`)
					.join(',');
				const payloadArguments = Array(payloadArgumentCount)
					.map((v, i) => `prop${i}`)
					.join(',');
				const stringToParse = `#{${contextArguments}} <= (${payloadArguments})`;
				return stringToParse;
			};
			const cases = Array(1000).map(() => generateCase(randomInteger()));
			test.each(cases)('%s --- CORRECT', (input) => {
				expect(() => parser.parse(input)).toThrowError();
			});
		});

		describe('Previous context cannot have more arguments than the current one', () => {
			const parser = new YantrixParser();
			const generateCase = (contextArgumentMaxCount: number) => {
				const contextArgumentCount = Math.ceil(Math.random() * contextArgumentMaxCount);
				const prevContextArgumentCount = contextArgumentCount + randomInteger();
				const contextArguments = Array(contextArgumentCount)
					.map((v, i) => `prop${i}`)
					.join(',');
				const prevContextArguments = Array(prevContextArgumentCount)
					.map((v, i) => `prop${i}`)
					.join(',');
				const stringToParse = `#{${contextArguments}} <= {${prevContextArguments}}`;
				return stringToParse;
			};
			const cases = Array(1000).map(() => generateCase(randomInteger()));
			test.each(cases)('%s --- ERROR', (input) => {
				expect(() => parser.parse(input)).toThrowError();
			});
		});

		describe('Context can have the same or more arguments than the previous context', () => {
			const parser = new YantrixParser();
			const generateCase = (prevContextArgumentMaxCount: number) => {
				const prevContextArgumentCount = Math.ceil(Math.random() * prevContextArgumentMaxCount);
				const contextArgumentCount = prevContextArgumentCount + randomInteger();
				const contextArguments = Array(contextArgumentCount)
					.map((v, i) => `prop${i}`)
					.join(',');
				const prevContextArguments = Array(prevContextArgumentCount)
					.map((v, i) => `prop${i}`)
					.join(',');
				const stringToParse = `#{${contextArguments}} <= {${prevContextArguments}}`;
				return stringToParse;
			};
			const cases = Array(1000).map(() => generateCase(randomInteger()));
			test.each(cases)('%s --- CORRECT', (input) => {
				expect(() => parser.parse(input)).toThrowError();
			});
		});
	});

	describe('Expression creation', () => {
		const parser = new YantrixParser();

		describe('Normal expressions', () => {
			describe('Correct expressions', () => {
				const cases = Array(1000).map(() => `#{${randomString()} = ${getRandomValue()}}`);
				test.each(cases)('%s --- CORRECT', (input) => {
					const result = parser.parse(input);
					assert.isOk(result.contextDescription[0].context[0].KeyItemDeclaration.Expression);
				});
			});

			describe.skip('Incorrect expressions', () => {
				const cases = [
					'',
					// ...Array(100).map(() => `#{${randomString()} - ${getRandomValue()}}`),
					// ...Array(100).map(() => `#{${randomString()}  ${getRandomValue()}}`),
					// ...Array(100).map(() => `#{${randomString()} == ${getRandomValue()}}`),
					// ...Array(100).map(() => `#{${randomString()} -> ${getRandomValue()}}`),
					// ...Array(100).map(() => `#{${randomString()} <- ${getRandomValue()}}`),
					// ...Array(100).map(() => `#{${randomString()} = ${getRandomValue()}}`),
				];
				test.each(cases)(`%s --- ERROR`, (input) => {
					expect(() => parser.parse(input)).toThrowError();
				});
			});
		});

		describe('Array expressions', () => {
			describe('Empty array expression can be created', () => {
				const cases = new Array(1000).map(() => `#{${randomString()} = []}`);
				test.each(cases)('%s --- CORRECT', (input) => {
					const result = parser.parse(input);
					assert.deepNestedInclude(
						result.contextDescription[0].context[0].KeyItemDeclaration.Expression,
						expressionProperties.array(),
					);
				});
			});

			// describe('Non-empty array expression cannot be created', () => {
			// 	// random amount of random values of random type
			// 	const cases = new Array(1000).map(() => {
			// 		const randomValueFunction = getRandomValueFunction();
			// 		const arrayValues = Array(randomInteger()).map(() => randomValueFunction()).join(',');
			// 		return `#{${randomString()} = [${arrayValues}]}`;
			// 	});
			// 	test.each(cases)('%s --- ERROR', (input) => {
			// 		expect(() => parser.parse(input)).toThrowError();
			// 	})
			// });
		});
	});

	// todo
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

	describe('State transformer creation', () => {
		const parser = new YantrixParser();

		describe('Correct expressions', () => {
			const cases = validStateTransformerStatements.flatMap((statement) => {
				return new Array(1000).map(() => statement.replaceAll('%s', () => randomString()));
			});
			test.each(cases)('%s --- CORRECT', (input) => {
				assert.isOk(parser.parse(input));
			});
		});

		describe('Incorrect expressions', () => {
			const cases = invalidStateTransformerStatements.flatMap((statement) => {
				return new Array(100).map(() => statement.replaceAll('%s', () => randomString()));
			});
			test.each(cases)('%s --- ERROR', (input) => {
				expect(() => parser.parse(input)).toThrowError();
			});
		});
	});

	describe('Subscribe statements creation', () => {
		const parser = new YantrixParser();
		const getRandomActionAttributes = () => {
			return new Array(randomInteger()).map(() => randomString()).join(',');
		};
		describe('Correct statements', () => {
			const cases = [
				'',
				// ...Array(5).map(() => `subscribe/${randomString()} => ${randomString()}`),
				// ...Array(5).map(() => `subscribe/${randomString()} => ${randomString()} (${getRandomActionAttributes()})`),
			];
			test.each(cases)('%s --- CORRECT', (input) => {
				assert.isOk(parser.parse(input));
			});
		});

		describe('Incorrect statements', () => {
			const cases = invalidSubscribeStatements.flatMap((statement) => {
				return new Array(100).map(() =>
					statement
						.replaceAll('%s', () => randomString())
						.replaceAll('%arr', () => getRandomActionAttributes()),
				);
			});
			test.each(cases)(`%s --- ERROR`, (str) => expect(() => parser.parse(str)).toThrowError());
		});
	});

	describe('Emit statements creation', () => {
		const parser = new YantrixParser();

		describe('Correct statements', () => {
			const cases = validEmitStatements.flatMap((statement) => {
				return new Array(100).map(() =>
					statement
						.replaceAll('%s', () => randomString())
						.replaceAll('%arr', () => getRandomArray(() => randomString()).join(',')),
				);
			});
			test.each(cases)('%s --- CORRECT', (str) => assert.isOk(parser.parse(str)));
		});

		describe('Incorrect statements', () => {
			const cases = invalidEmitStatements.flatMap((statement) => {
				return new Array(100).map(() =>
					statement
						.replaceAll('%s', () => randomString())
						.replaceAll('%arr', () => getRandomArray(() => randomString()).join(',')),
				);
			});
			test.each(cases)(`%s --- ERROR`, (str) => expect(() => parser.parse(str)).toThrowError());
		});
	});
});
