import {
	randomArray,
	randomDecimal,
	randomInteger,
	randomString,
	randomValue,
	randomValueFunction,
} from '@yantrix/utils';
import { assert, describe, expect, it } from 'vitest';
import { ReservedList, SpecialCharList } from '../src/constants/index.js';
import { YantrixParser } from '../src/yantrixParser.js';
import {
	baseContext,
	baseContextWithPrevious,
	baseEmitEvent,
	baseEmpty,
	baseSubscribe,
} from './fixtures/baseDeclarations.js';
import { expressionProperties } from './fixtures/expressions.js';

const validContextStatements = ['#{%s}'];
const invalidContextStatements = [
	...ReservedList.map(reservedWord => `#{${reservedWord}}`),
	...SpecialCharList.map((char: string) => `${char}{%s}`),
	'#[%s]',
	'#(%s)',
];

const validExpressionStatements = [
	`#{%s = #%s}`,
	`#{%s = '%s'}`,
	`#{%s = $%s}`,
	`#{%s = %%%s}`,
	`#{%s = []}`,
	`#{%s = '%i'}`,
	`#{%s = '%d'}`,
];
const invalidExpressionStatements = [
	`#{%s - %rand}`,
	`#{%s  %rand}`,
	`#{%s == %rand}`,
	`#{%s -> %rand}`,
	`#{%s <- %rand}`,
];

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

const validSubscribeStatements = ['subscribe/%s %s', 'subscribe/%s %s (#%s)', 'subscribe/%s %s (#%s) <= (#%s)'];

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
	`subscribe/%s => %s [%list]`,
	`subscribe/%s => %s {%list}`,
	`subscribe/%s <= %s ()`,
];

const validEmitStatements = [`emit/%s`, `emit/%s (#%s)`, 'emit/%s (#%s) <= #{%s}'];
const invalidEmitStatements = [
	`emt/%s`,
	`emit/%s <= %list`,
	`emit/%s <= ()`,
	`emit/%s <=`,
	`emit/%s =>`,
	`emit/%s <= {%list}`,
	`emit/%s <= [%list]`,
	`emit/%s => (%list)`,
];

function generateRandomStatementsFromTemplate(arr: string[], casesAmount: number = randomInteger(1, 20)) {
	return arr.flatMap((template) => {
		return Array.from({ length: casesAmount }, () =>
			template
				.replaceAll('%i', () => randomInteger().toString())
				.replaceAll('%d', () => randomDecimal().toString())
				.replaceAll('%rand', () => randomValue().toString())
				.replaceAll('%list', () => randomArray(randomString).join(','))
				.replaceAll('%s', () => randomString()));
	});
}

const expressionTemplates = [
	['#{%s = "%s"}', expressionProperties.string],
	['#{%s = %i}', expressionProperties.integer],
	['#{%s = %d}', expressionProperties.decimal],
	['#{%s = %%%s}', expressionProperties.constantRefrence],
	['#{%s = %arr}', expressionProperties.array],
	['#{%s = #%s}', expressionProperties.contextReference],
	['#{%s = $%s}', expressionProperties.payloadReference],
	['#{%s = %s()}', expressionProperties.function],
];

const templateFunctions: { [key: string]: (...args: any) => any } = {
	'"%s"': (templateString: string, func: (...args: any) => any) => {
		const val = randomString();
		return [templateString.replace('"%s"', `"${val}"`), func(val)];
	},
	'%s': (templateString: string, func: (...args: any) => any) => {
		const val = randomString();
		return [templateString.replace('%s', val), func(val)];
	},
	'%i': (templateString: string, func: (...args: any) => any) => {
		const val = randomInteger();
		return [templateString.replace('%i', val.toString()), func(val)];
	},
	'%d': (templateString: string, func: (...args: any) => any) => {
		const val = randomDecimal();
		return [templateString.replace('%d', val.toString()), func(val)];
	},
	'%arr': (templateString: string, func: (...args: any) => any) => {
		return [templateString.replace('%arr', '[]'), func('[]')];
	},
	'default': (templateString: string, func: (...args: any) => any) => {
		const val = randomString();
		return [templateString.replace('', ''), func(val)];
	},
};

function generateExpressionStringAndExpectedObject(args: [string, (value: any) => any]) {
	const templateString = args[0];
	const func = args[1];
	const templateStringWithName = templateString.replace('%s', randomString());

	for (const regex in templateFunctions) {
		if (templateStringWithName.match(regex)) {
			return templateFunctions[regex]?.(templateStringWithName, func);
		}
	}
	return templateFunctions.default?.(templateStringWithName, func);

	// if (templateStringWithName.match('"%s"')) {
	// 	const val = randomString();
	// 	return [templateStringWithName.replace('"%s"', `"${val}"`), func(val)];
	// } else if (templateStringWithName.match('%s')) {
	// 	const val = randomString();
	// 	return [templateStringWithName.replace('%s', val), func(val)];
	// } else if (templateStringWithName.match('$(%s)')) {
	// 	const val = randomString();
	// 	return [templateStringWithName.replace('%s', val), func(`${val}`)];
	// } else if (templateStringWithName.match('%i')) {
	// 	const val = randomInteger();
	// 	return [templateStringWithName.replace('%i', val.toString()), func(val)];
	// } else if (templateStringWithName.match('%d')) {
	// 	const val = randomDecimal();
	// 	return [templateStringWithName.replace('%d', val.toString()), func(val)];
	// } else if (templateStringWithName.match(/(\[\])/)) {
	// 	return [templateStringWithName, func('[]')];
	// } else if (templateStringWithName.match('%s()')) {
	// 	const val = randomString();
	// 	return [templateStringWithName.replace('%s()', `${val}()`), func(val)];
	// } else return [];
}
function generateExpressionCases(templates: any[], casesAmount: number = randomInteger(1, 50)) {
	return templates.flatMap((template) => {
		return Array.from({ length: casesAmount }, () => generateExpressionStringAndExpectedObject(template));
	});
}

function createTuple(valueFunction: () => string | number) {
	const values = Array.from({ length: randomInteger(1, 12) }, valueFunction);
	return [...values] as const;
}

describe('base grammar declarations', () => {
	describe('base constructs creation', () => {
		const parser = new YantrixParser();
		const base = [
			['', baseEmpty],
			['#{LeftSideProperty} <= #RightSideProperty', baseContext],
			['#{LeftSideProperty} <= $RightSideProperty', baseContextWithPrevious],
			['subscribe/event action (#m) <= (#k)', baseSubscribe],
			['emit/event (#t) <= #{ab}', baseEmitEvent],
		] as const;
		it.each(base)('%s', (input: any, res: any) => {
			const result = parser.parse(input as string);
			assert.deepOwnInclude(result, res);
		});
	});
	describe('identical output with ', () => {
		it('#{Left1, Left2} <= #Right1, #Right2 is #{Left2, Left1} <= #Right2, #Right1', () => {
			const parser = new YantrixParser();

			const [left1, left2, right1, right2] = Array.from(Array.from({ length: 4 }), () => randomString());

			const parsedLeft = parser.parse(`#{${left1}, ${left2}} <= $${right1}, $${right2}`);
			const parsedRight = parser.parse(`#{${left2}, ${left1}} <= $${right2}, $${right1}`);
			const contextLeftDescription = parsedLeft.contextDescription[0];
			const contextRightDescription = parsedRight.contextDescription[0];

			const { context: contextLeft, reducer: payloadLeft } = contextLeftDescription;
			const { context: contextRight, reducer: payloadRight } = contextRightDescription;

			expect(contextLeft[0]).toStrictEqual(contextRight[1]);
			expect(contextLeft[1]).toStrictEqual(contextRight[0]);

			expect(payloadLeft[0]).toStrictEqual(payloadRight[1]);
			expect(payloadLeft[1]).toStrictEqual(payloadRight[0]);
		});

		it('#{Left1, Left2, Left3} <= (Right1, Right2) = #{Left2, Left1, Left3} <= (Right2, Right1)', () => {
			const parser = new YantrixParser();
			const [left1, left2, left3, right1, right2] = Array.from(Array.from({ length: 4 }), () => randomString());
			const parsedLeft = parser.parse(`#{${left1}, ${left2}, ${left3}} <= $${right1}, $${right2}`);
			const parsedRight = parser.parse(`#{${left2}, ${left1}, ${left3}} <= $${right2}, $${right1}`);
			const contextLeftDescription = parsedLeft.contextDescription[0];
			const contextRightDescription = parsedRight.contextDescription[0];

			const { context: contextLeft, reducer: payloadLeft } = contextLeftDescription;
			const { context: contextRight, reducer: payloadRight } = contextRightDescription;

			expect(contextLeft[0]).toStrictEqual(contextRight[1]);
			expect(contextLeft[1]).toStrictEqual(contextRight[0]);
			expect(contextLeft[2]).toStrictEqual(contextRight[2]);

			expect(payloadLeft[0]).toStrictEqual(payloadRight[1]);
			expect(payloadLeft[1]).toStrictEqual(payloadRight[0]);
			expect(payloadLeft[2]).toStrictEqual(payloadRight[2]);
		});
		it('#{Left1, Left2, Left3} = #{     Left1,	Left2      ,   Left3  }', () => {
			const parser = new YantrixParser();
			const [left1, left2, left3] = Array.from({ length: 3 }).map(() => randomString());
			const parsedLeft = parser.parse(`#{${left1}, ${left2}, ${left3}}`);
			const parsedRight = parser.parse(`#{     ${left1},	${left2}      ,   ${left3}   }`);
			const contextLeftDescription = parsedLeft.contextDescription[0];
			const contextRightDescription = parsedRight.contextDescription[0];

			const { context: contextLeft } = contextLeftDescription;
			const { context: contextRight } = contextRightDescription;

			contextLeft.forEach((el: any, index: any) => {
				expect(el).toMatchObject(contextRight[index]);
			});
		});
	});

	describe('context statement creation', () => {
		const parser = new YantrixParser();

		describe('correct statements', () => {
			const cases = generateRandomStatementsFromTemplate(validContextStatements);
			it.each(cases)('%s --- CORRECT', (input) => {
				const result = parser.parse(input);
				assert.isOk(result);
			});
		});

		describe('incorrect statements', () => {
			const cases = generateRandomStatementsFromTemplate(invalidContextStatements);
			it.each(cases)('%s -- ERROR', (input) => {
				expect(() => parser.parse(input)).toThrowError();
			});
		});
	});

	describe('key item descriptor creation', () => {
		const parser = new YantrixParser();

		describe('key item descriptor cannot start with or contain a special character', () => {
			const cases = [
				...SpecialCharList.map((char: string) => `#{${char}${randomString()}}`),
				...SpecialCharList.map((char: string) => `#{${randomString()}${char}}`),
			];
			it.each(cases)('%s --- ERROR', (input) => {
				expect(() => parser.parse(input)).toThrowError();
			});
		});

		describe('key item descriptor cannot start with a number', () => {
			const cases = [...Array.from({ length: 10 }).keys()].map(number => `#{${number}${randomString()}}`);
			it.each(cases)('%s --- ERROR', (input) => {
				expect(() => parser.parse(input)).toThrowError();
			});
		});

		describe('key item descriptor can contain numbers after the first symbol', () => {
			const descriptorLength = randomInteger();
			const stringBeforeNumber = randomString(randomInteger(1, descriptorLength));
			const stringAfterNumber = randomString(descriptorLength - stringBeforeNumber.length);
			const cases = [...Array.from({ length: 10 }).keys()].map(
				number => `#{${stringBeforeNumber}${number}${stringAfterNumber}}`,
			);
			it.each(cases)('%s --- CORRECT', (input) => {
				assert.isOk(parser.parse(input));
			});
		});

		describe('key item descriptor can start with lowercase and uppercase letters', () => {
			const cases = Array.from({ length: randomInteger() }, () =>
				Math.random() < 0.5 ? `#{${randomString().toUpperCase()}}` : `#{${randomString().toLowerCase()}}`);
			it.each(cases)('%s --- CORRECT', (input) => {
				const result = parser.parse(input);
				assert.isOk(result);
			});
		});
	});

	describe('argument count comparisons', () => {
		describe('payload cannot have more arguments than the context', () => {
			const parser = new YantrixParser();
			const generateCase = (contextArgumentMaxCount: number) => {
				const contextArgumentCount = Math.ceil(Math.random() * contextArgumentMaxCount);
				const payloadArgumentCount = contextArgumentCount + randomInteger();

				const contextArguments = Array.from({ length: contextArgumentCount }, (_, i) => `prop${i}`).join(',');
				const payloadArguments = Array.from({ length: payloadArgumentCount }, (_, i) => `prop${i}`).join(',');
				const stringToParse = `#{${contextArguments}} <= (${payloadArguments})`;
				return stringToParse;
			};
			const cases = Array.from({ length: randomInteger() }, () => generateCase(randomInteger()));
			it.each(cases)('%s --- ERROR', (input) => {
				expect(() => parser.parse(input)).toThrowError();
			});
		});

		// !!!
		describe('context can have the same or more arguments than the payload', () => {
			const parser = new YantrixParser();
			const generateCase = (payloadArgumentMaxCount: number) => {
				const payloadArgumentCount = Math.ceil(Math.random() * payloadArgumentMaxCount);
				const contextArgumentCount = payloadArgumentCount + randomInteger();
				const contextArguments = Array.from({ length: contextArgumentCount }, (_, i) => `prop${i}`).join(',');
				const payloadArguments = Array.from({ length: payloadArgumentCount }, (_, i) => `$prop${i}`).join(',');
				const stringToParse = `#{${contextArguments}} <= ${payloadArguments}`;
				return stringToParse;
			};
			const cases = Array.from({ length: randomInteger() }, () => generateCase(randomInteger()));
			it.each(cases)('%s --- CORRECT', (input) => {
				assert.isOk(parser.parse(input));
			});
		});

		describe('previous context cannot have more arguments than the current one', () => {
			const parser = new YantrixParser();
			const generateCase = (contextArgumentMaxCount: number) => {
				const contextArgumentCount = Math.ceil(Math.random() * contextArgumentMaxCount);
				const prevContextArgumentCount = contextArgumentCount + randomInteger();
				const contextArguments = Array.from({ length: contextArgumentCount }, (_, i) => `prop${i}`).join(',');
				const prevContextArguments = Array.from(
					{ length: prevContextArgumentCount },
					(_, i) => `prop${i}`,
				).join(',');
				const stringToParse = `#{${contextArguments}} <= {${prevContextArguments}}`;
				return stringToParse;
			};
			const cases = Array.from({ length: randomInteger() }, () => generateCase(randomInteger()));
			it.each(cases)('%s --- ERROR', (input) => {
				expect(() => parser.parse(input)).toThrowError();
			});
		});

		describe('context can have the same or more arguments than the previous context', () => {
			const parser = new YantrixParser();
			const generateCase = (prevContextArgumentMaxCount: number) => {
				const prevContextArgumentCount = Math.ceil(Math.random() * prevContextArgumentMaxCount);
				const contextArgumentCount = prevContextArgumentCount + randomInteger();
				const contextArguments = Array.from({ length: contextArgumentCount }, (_, i) => `prop${i}`).join(',');
				const prevContextArguments = Array.from(
					{ length: prevContextArgumentCount },
					(_, i) => `#prop${i}`,
				).join(',');
				const stringToParse = `#{${contextArguments}} <= ${prevContextArguments}`;
				return stringToParse;
			};
			const cases = Array.from({ length: randomInteger() }, () => generateCase(randomInteger()));
			it.each(cases)('%s --- CORRECT', (input) => {
				assert.isOk(parser.parse(input));
			});
		});
	});

	describe('expression creation', () => {
		const parser = new YantrixParser();

		describe('normal expressions', () => {
			describe('correct expressions', () => {
				const cases = generateRandomStatementsFromTemplate(validExpressionStatements);
				it.each(cases)('%s --- CORRECT', (input) => {
					const result = parser.parse(input);
					assert.isOk(result.contextDescription[0].context[0].keyItem.expression);
				});
			});

			describe('incorrect expressions', () => {
				const cases = generateRandomStatementsFromTemplate(invalidExpressionStatements);
				it.each(cases)(`%s --- ERROR`, (input) => {
					expect(() => parser.parse(input)).toThrowError();
				});
			});
		});

		describe('array expressions', () => {
			describe('empty array expression can be created', () => {
				const cases = Array.from({ length: randomInteger() }, () => `#{${randomString()} = []}`);
				it.each(cases)('%s --- CORRECT', (input) => {
					const result = parser.parse(input);
					assert.deepNestedInclude(
						result.contextDescription[0].context[0].keyItem.expression,
						expressionProperties.array(),
					);
				});
			});

			describe('non-empty array expression cannot be created', () => {
				// random values of random type
				const cases = Array.from(
					{ length: 1000 },
					() => `#{${randomString()} = [${createTuple(randomValueFunction()).toString()}]}`,
				);
				it.each(cases)('%s --- ERROR', (input) => {
					expect(() => parser.parse(input)).toThrowError();
				});
			});
		});
	});

	describe('expression values are separated into strings, integers, decimals, functions etc', () => {
		const parser = new YantrixParser();

		const cases = generateExpressionCases(expressionTemplates);
		it.each(cases)('%s', (input: string, obj) => {
			const result = parser.parse(input);
			assert.deepNestedInclude(result.contextDescription[0].context[0].keyItem.expression, obj);
		});
	});

	describe('state transformer creation', () => {
		const parser = new YantrixParser();

		describe('correct expressions', () => {
			const cases = generateRandomStatementsFromTemplate(validStateTransformerStatements);
			it.each(cases)('%s --- CORRECT', (input) => {
				assert.isOk(parser.parse(input));
			});
		});

		describe('incorrect expressions', () => {
			const cases = generateRandomStatementsFromTemplate(invalidStateTransformerStatements);
			it.each(cases)('%s --- ERROR', (input) => {
				expect(() => parser.parse(input)).toThrowError();
			});
		});
	});

	describe('subscribe statements creation', () => {
		const parser = new YantrixParser();

		describe('correct expressions', () => {
			const cases = generateRandomStatementsFromTemplate(validSubscribeStatements);
			it.each(cases)('%s --- CORRECT', (input) => {
				assert.isOk(parser.parse(input));
			});
		});

		describe('incorrect expressions', () => {
			const cases = generateRandomStatementsFromTemplate(invalidSubscribeStatements);
			it.each(cases)('%s --- ERROR', (input) => {
				expect(() => parser.parse(input)).toThrowError();
			});
		});
	});

	describe('emit statements creation', () => {
		const parser = new YantrixParser();

		describe('correct statements', () => {
			const cases = generateRandomStatementsFromTemplate(validEmitStatements);
			it.each(cases)('%s --- CORRECT', str => assert.isOk(parser.parse(str)));
		});

		describe('incorrect statements', () => {
			const cases = generateRandomStatementsFromTemplate(invalidEmitStatements);
			it.each(cases)(`%s --- ERROR`, str => expect(() => parser.parse(str)).toThrowError());
		});
	});
});
