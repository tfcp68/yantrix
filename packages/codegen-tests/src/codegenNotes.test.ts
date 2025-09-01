import { ModuleNames } from '@yantrix/codegen';
import { randomArray, randomDecimal, randomInteger, randomString } from '@yantrix/core';
import { beforeAll, describe, expect, it } from 'vitest';
import { constant, generateAssignCase, getReferenceAssign } from './fixtures/defaultAssign';
import { generateAndSave, mapFromObjectToString, objectKeysToString } from './fixtures/utils';

function getTemplate(secondNote: string, firstNote?: string) {
	return `stateDiagram-v2
		[*] --> A: toA
		A --> B: toB
		${firstNote
				? `note left of A
			${firstNote}
		end note`
				: ''
		}
		note left of B
			${secondNote}
		end note`;
}

function getTemplateInput(note: string) {
	return `stateDiagram-v2
		[*] --> A: toA
		note left of A
			${note}
		end note`;
}

function getTemplateWithPreviousContext() {
	const defaultSuite = getReferenceAssign();

	const res = defaultSuite.reduce(
		(acc, el) => {
			acc.prevContext[el.ident] = el.value;

			if (el.referenceType === 'payload' && el?.payloadIdent) {
				acc.dispatchObject[el?.payloadIdent] = el.value;
			}

			return acc;
		},
		{ prevContext: {} as Record<string, any>, dispatchObject: {} as Record<string, any> },
	);

	return {
		input: `stateDiagram-v2
		[*] --> A: toA
		A --> B: toB
		note left of A
			#{${defaultSuite.map(item => item.input).join(',')}}
		end note
		note left of B
			#{${defaultSuite.map(el => el.ident).join(',')}}
		end note
		`,
		output: res.prevContext,
		dispatchObject: res.dispatchObject,
		name: 'LeftAsssignWithPreviusReference',
	};
}

describe('byPass state', () => {
	it('should throw an error if the ByPass state has more than 1 transition', async () => {
		const template = `stateDiagram-v2
		B --> EXIT: [-]
		B --> Failed: [-]
		note left of B
		 	+ByPass
		end note`;

		const call = () => generateAndSave({ input: template, automataName: 'Test', lang: ModuleNames.JavaScript }, 'byPassError');

		await expect(call).rejects.toThrowError();
	});
	it('should throw an error if the ByPass state has no transition', async () => {
		const template = `stateDiagram-v2
		C --> B: KEK
		note left of B
		 	+ByPass
		end note`;

		const call = () => generateAndSave({ input: template, automataName: 'Test', lang: ModuleNames.JavaScript }, 'byPassError');

		await expect(call).rejects.toThrowError();
	});
	it('should throw an error if the ByPass state has no action [-]', async () => {
		const template = `stateDiagram-v2
		C --> B: toB
		B --> F: exit
		note left of B
		 	+ByPass
		end note`;

		const call = () => generateAndSave({ input: template, automataName: 'Test', lang: ModuleNames.JavaScript }, 'byPassError');

		await expect(call).rejects.toThrowError();
	});
	it('payload is not propagated through ByPass', async () => {
		const template = `stateDiagram-v2
		C --> B: toB(a)
		B --> F: [-]
		note left of B
		 	+ByPass
		end note
		note right of F
			#{a = 100} <= $a
		end note
		`;

		await generateAndSave({ input: template, automataName: 'Test', lang: ModuleNames.JavaScript }, 'byPassPayload');

		const res = await import(`./fixtures/generated/byPassPayload_generated.js`);
		const automata = new res.Test();

		automata.dispatch({ action: res.actionsDictionary.toB, payload: { a: 300 } });

		expect(automata.context).toStrictEqual({ a: 100 });
	});
	it('the finite automaton must go to the next state after the byPasses state', async () => {
		const template = `stateDiagram-v2
		C --> B: toB
		B --> EXIT: [-]
		note left of B
		 	+ByPass
		end note
		`;

		await generateAndSave({ input: template, automataName: 'Test', lang: ModuleNames.JavaScript }, 'byPassedState');

		const res = await import(`./fixtures/generated/byPassedState_generated.js`);
		const automata = new res.Test();

		automata.dispatch({ action: res.actionsDictionary.toB, payload: {} });

		expect(automata.state).toBe(res.statesDictionary.EXIT);
	});
});

describe('default assign', async () => {
	const defaultSuite = getReferenceAssign();
	const input = '#{'.concat(defaultSuite.map(el => el.input).join(',')).concat('}');

	const left = '#{'.concat(
		defaultSuite
			.map(el => el.ident)
			.join(',')
			.concat('}'),
	);

	const inputContext = left.concat('<=').concat(defaultSuite.map(el => '#'.concat(el.input)).join(','));
	const inputPayload = left.concat('<=').concat(defaultSuite.map(el => '$'.concat(el.input)).join(','));

	/*
	Empty payload and previous context
	constant = pi = 3.14
	*/
	const defaultAssignLeft = generateAssignCase(input, 'LeftAssign', defaultSuite);
	const defaultAssignRightContext = generateAssignCase(inputContext, 'RightAssignPreviousContext', defaultSuite);
	const defaultAssignRightPayload = generateAssignCase(inputPayload, 'RightAssignPayload', defaultSuite);

	/*
	With payload and previous context, all expressions
	constant = pi = 3.14
	*/

	const defaultAssignLeftPrevious = getTemplateWithPreviousContext();

	const res = [defaultAssignLeft, defaultAssignRightContext, defaultAssignRightPayload];

	const notesWithTemplate = res.map((el) => {
		return { ...el, input: getTemplateInput(el.input) };
	});
	const allNotes = [...notesWithTemplate, defaultAssignLeftPrevious];

	beforeAll(async () => {
		for (const note of allNotes) {
			const input = note.input;

			await generateAndSave(
				{ input, automataName: 'Test', lang: ModuleNames.JavaScript, constants: JSON.stringify(constant) },
				note.name,
			);
		}
	});

	it('left assign #{a=string | constant | number | list  | emptyPayload = {} | emptypreviousContext = {} }', async () => {
		const { output, dispatchObject } = defaultAssignLeft;

		const res = await import(`./fixtures/generated/LeftAssign_generated.js`);

		const automata = new res.Test();
		automata.dispatch({ action: res.actionsDictionary.toA, payload: dispatchObject });

		expect(automata.context).toStrictEqual(output);
	});
	it('left assign with previous context and payload #{ a=$payload, $b=#prevContext } prevContext - all expressions', async () => {
		const { output, dispatchObject } = defaultAssignLeftPrevious;

		const res = await import(`./fixtures/generated/LeftAsssignWithPreviusReference_generated.js`);

		const automata = new res.Test();
		automata.dispatch({ action: res.actionsDictionary.toA, payload: dispatchObject });
		automata.dispatch({ action: res.actionsDictionary.toB, payload: {} });

		expect(automata.context).toStrictEqual(output);
	});
	it('right assign with #a,#b = (list, constant, integer, string, payload = {}, prevContext = {})', async () => {
		const { output, dispatchObject } = defaultAssignRightContext;

		const res = await import(`./fixtures/generated/RightAssignPreviousContext_generated.js`);

		const automata = new res.Test();
		automata.dispatch({ action: res.actionsDictionary.toA, payload: dispatchObject });

		expect(automata.context).toStrictEqual(output);
	});

	it('right assign payload $a,$b = (list, constant, integer, string, payload = {}, prevContext = {}', async () => {
		const { output, dispatchObject } = defaultAssignRightPayload;

		const res = await import(`./fixtures/generated/RightAssignPayload_generated.js`);

		const automata = new res.Test();
		automata.dispatch({ action: res.actionsDictionary.toA, payload: dispatchObject });

		expect(automata.context).toStrictEqual(output);
	});
	it('in the function call #{a} <= add($a=10, $b=5)', async () => {
		const note = `#{a} <= add($a=10, $b=5)`;
		const input = getTemplateInput(note);

		await generateAndSave({ input, automataName: 'Test', lang: ModuleNames.JavaScript }, 'functionDefaultAssign');

		const res = await import(`./fixtures/generated/functionDefaultAssign_generated.js`);

		const automata = new res.Test();
		automata.dispatch({ action: res.actionsDictionary.toA, payload: {} });

		expect(automata.context).toStrictEqual({ a: 15 });
	});
});

describe('reducers', () => {
	it('#{a,b} from previous to shortcut, prev:{a:3,b:"str"}', async () => {
		const context = {
			a: randomInteger(),
			b: randomString(),
		};
		const previousContextString = mapFromObjectToString(context);
		const current = Object.keys(context).join(',');

		const input = getTemplate(`#{${current}}`, `#{${previousContextString}}`);

		await generateAndSave({ input, automataName: 'Test', lang: ModuleNames.JavaScript }, 'shortcutContext');
		const res = await import(`./fixtures/generated/shortcutContext_generated.js`);

		const automata = new res.Test();

		automata.dispatch({ action: res.actionsDictionary.toA, payload: {} });
		automata.dispatch({ action: res.actionsDictionary.toB, payload: {} });

		expect(automata.context).toStrictEqual(context);
	});
	it('#{a,b} shortcut, with missing previus context, "a" and "b" should be null', async () => {
		const output = {
			a: null,
			b: null,
		};
		const left = Object.keys(output).join(',');

		const input = getTemplate(`#{${left}}`);

		await generateAndSave({ input, automataName: 'Test', lang: ModuleNames.JavaScript }, 'shortcutContextWithNull');
		const res = await import(`./fixtures/generated/shortcutContextWithNull_generated.js`);

		const automata = new res.Test();

		automata.dispatch({ action: res.actionsDictionary.toA, payload: {} });
		automata.dispatch({ action: res.actionsDictionary.toB, payload: {} });

		expect(automata.context).toStrictEqual(output);
	});
	it('#{a,b} <= #a, #b, with previous context', async () => {
		const output = {
			a: randomInteger(),
			b: randomString(),
		};
		const left = Object.keys(output).join(',');
		const previousContextString = mapFromObjectToString(output);
		const right = objectKeysToString(output, '#');

		const input = getTemplate(`#{${left}} <= ${right}`, `#{${previousContextString}}`);

		await generateAndSave({ input, automataName: 'Test', lang: ModuleNames.JavaScript }, 'defaultContext');
		const res = await import(`./fixtures/generated/defaultContext_generated.js`);

		const automata = new res.Test();

		automata.dispatch({ action: res.actionsDictionary.toA, payload: {} });
		automata.dispatch({ action: res.actionsDictionary.toB, payload: {} });

		expect(automata.context).toStrictEqual(output);
	});
	it('#{a,b} <= #a, #b, previous context is missing', async () => {
		const output = {
			a: null,
			b: null,
		};

		const left = objectKeysToString(output);
		const right = objectKeysToString(output, '#');
		const input = getTemplate(`#{${left}} <= ${right}`);

		await generateAndSave({ input, automataName: 'Test', lang: ModuleNames.JavaScript }, 'nullContextFull');
		const res = await import(`./fixtures/generated/nullContextFull_generated.js`);

		const automata = new res.Test();

		automata.dispatch({ action: res.actionsDictionary.toA, payload: {} });
		automata.dispatch({ action: res.actionsDictionary.toB, payload: {} });

		expect(automata.context).toStrictEqual(output);
	});
	it('#{a,b,c,d} <= payload(integer), payload(string)...', async () => {
		const payload = {
			a: randomInteger(),
			b: randomString(),
			c: randomDecimal(),
			d: randomArray(randomInteger),
		};

		const left = objectKeysToString(payload);
		const right = objectKeysToString(payload, '$');

		const input = getTemplate(`#{${left}} <= ${right}`);

		await generateAndSave({ input, automataName: 'Test', lang: ModuleNames.JavaScript }, 'payloadBase');
		const res = await import(`./fixtures/generated/payloadBase_generated.js`);

		const automata = new res.Test();

		automata.dispatch({ action: res.actionsDictionary.toA, payload: {} });
		automata.dispatch({ action: res.actionsDictionary.toB, payload });

		expect(automata.context).toStrictEqual(payload);
	});
	it('#{} <= $payload, without passed payload', async () => {
		const payload = {};
		const output = {
			a: null,
			b: null,
		};
		const input = `#{${objectKeysToString(output)}} <= $payload1, $payload2`;

		await generateAndSave(
			{ input: getTemplate(input), automataName: 'Test', lang: ModuleNames.JavaScript },
			'payloadWithEmptyObject',
		);
		const res = await import(`./fixtures/generated/payloadWithEmptyObject_generated.js`);

		const automata = new res.Test();

		automata.dispatch({ action: res.actionsDictionary.toA, payload: {} });
		automata.dispatch({ action: res.actionsDictionary.toB, payload });

		expect(automata.context).toStrictEqual(output);
	});
	it('#{a} <= expressions(string,number,arr)', async () => {
		const output = {
			a: randomInteger(),
			b: randomString(),
			c: randomDecimal(),
			d: [],
		};
		const input = `#{a,b,c,d} <= ${output.a}, "${output.b}", ${output.c}, []`;

		await generateAndSave(
			{ input: getTemplate(input), automataName: 'Test', lang: ModuleNames.JavaScript },
			'expressionReducer',
		);
		const res = await import(`./fixtures/generated/expressionReducer_generated.js`);

		const automata = new res.Test();

		automata.dispatch({ action: res.actionsDictionary.toA, payload: {} });
		automata.dispatch({ action: res.actionsDictionary.toB, payload: {} });

		expect(automata.context).toStrictEqual(output);
	});
	it('#{a} <= add($a,$b)', async () => {
		const output = {
			a: 4,
		};

		const input = `#{a} <= add($a,$b)`;
		const test = `stateDiagram-v2
		[*] --> B: toB
		note left of B
			${input}
		end note`;

		await generateAndSave({ input: test, automataName: 'Test', lang: ModuleNames.JavaScript }, 'functionCall');
		const res = await import(`./fixtures/generated/functionCall_generated.js`);

		const automata = new res.Test();

		automata.dispatch({ action: res.actionsDictionary.toB, payload: { a: 2, b: 2 } });

		expect(automata.context).toStrictEqual(output);
	});
});

describe('constants reference', () => {
	const constants = {
		path: randomString(),
		decimal: randomDecimal(),
		integer: randomInteger(),
	};

	it('constant reference should be replaced by value in dictionary', async () => {
		const output = {
			a: constants.path,
			b: constants.decimal,
			c: constants.integer,
		};
		const input = `#{a,b,c} <= %%path, %%decimal, %%integer`;

		await generateAndSave(
			{
				input: getTemplateInput(input),
				automataName: 'Test',
				lang: ModuleNames.JavaScript,
				constants: JSON.stringify(constants),
			},
			'constants',
		);

		const res = await import(`./fixtures/generated/constants_generated.js`);
		const automata = new res.Test();

		automata.dispatch({ action: res.actionsDictionary.toA, payload: {} });

		expect(automata.context).toStrictEqual(output);
	});
	it('constant value should be number or string', async () => {
		const invalid = {
			a: [],
			b: { a: 3 },
			c: () => { },
		};

		Object.entries(invalid).forEach(async ([key, value]) => {
			const call = async () => {
				await generateAndSave(
					{
						input: getTemplateInput(`#{a,b,c} <= %%i1, %%i2, %%i3`),
						automataName: 'Test',
						lang: ModuleNames.JavaScript,
						constants: JSON.stringify({ [key]: value }),
					},
					'constants',
				);
			};
			await expect(call).rejects.toThrowError();
		});
	});
	it('codegen should throw an error if there is no key found in the dictionary.', async () => {
		const input = `#{a,b,c} <= %%t1, %%t2, %%t3`;

		const call = async () => {
			await generateAndSave(
				{
					input: getTemplateInput(input),
					automataName: 'Test',
					lang: ModuleNames.JavaScript,
					constants: JSON.stringify(constants),
				},
				'constants',
			);
		};
		await expect(call).rejects.toThrowError();
	});
	it('codgen should throw an error if the dictionary is missing', async () => {
		const input = `#{a,b,c} <= %%t1, %%t2, %%t3`;

		const call = async () => {
			await generateAndSave(
				{
					input: getTemplateInput(input),
					automataName: 'Test',
					lang: ModuleNames.JavaScript,
				},
				'constants',
			);
		};
		await expect(call).rejects.toThrowError();
	});
});

describe('initial', () => {
	it('the +INIT state must be the initial state for the automata', async () => {
		const input = `stateDiagram-v2
		C --> A: a
		A --> F: t
		note left of A
			+init
		end note;
		`;
		await generateAndSave({ input, automataName: 'Test', lang: ModuleNames.JavaScript }, 'qwerty');
		const res = await import(`./fixtures/generated/qwerty_generated.js`);

		const automata = new res.Test();

		expect(automata.state).toBe(res.statesDictionary.A);
	});
	it('by default start state should be first state in note', async () => {
		const input = `stateDiagram-v2
		C --> A: a
		A --> F: t
		`;

		await generateAndSave({ input, automataName: 'Test', lang: ModuleNames.JavaScript }, 'defaultStartState');
		const res = await import(`./fixtures/generated/defaultStartState_generated.js`);

		const automata = new res.Test();

		expect(automata.state).toBe(res.statesDictionary.C);
	});
});

describe('default context', () => {
	it('reducer from [*] shared between states', async () => {
		const output = {
			a: randomInteger(),
			b: randomInteger(),
		};

		const defaultNote = `#{${mapFromObjectToString(output)}}`;
		const keys = objectKeysToString(output);

		const input = `
			stateDiagram-v2
			[*] --> C: toC
			note left of [*]
			  ${defaultNote}
			end note
			note left of C
				#{${keys}}
			end note

		`;

		await generateAndSave({ input, automataName: 'Test', lang: ModuleNames.JavaScript }, 'tata');
		const res = await import(`./fixtures/generated/tata_generated.js`);

		const automata = new res.Test();

		automata.dispatch({ action: res.actionsDictionary.toC, payload: {} });

		expect(automata.context).toStrictEqual(output);
	});
	it('by default, the context should be empty object', async () => {
		await generateAndSave(
			{
				input: `stateDiagram-v2
					[*] --> C: toC
					`,
				automataName: 'Test',
				lang: ModuleNames.JavaScript,
			},
			'defaultContextEmptyObject',
		);
		const res = await import(`./fixtures/generated/defaultContextEmptyObject_generated.js`);

		const automata = new res.Test();

		expect(automata.context).toStrictEqual({});
	});
});

describe('functions', () => {
	it('nested call, mult(avg($list),$count)', async () => {
		const input = `#{a} <= mult(avg($list = []),$count = 0)`;
		await generateAndSave(
			{
				input: getTemplateInput(input),
				automataName: 'Test',
				lang: ModuleNames.JavaScript,
			},
			'nestedCallFunction',
		);
		const res = await import(`./fixtures/generated/nestedCallFunction_generated.js`);

		const automata = new res.Test();

		automata.dispatch({ action: res.actionsDictionary.toA, payload: { list: [1, 2, 4, 1], count: 2 } });

		expect(automata.context).toStrictEqual({ a: 4 });
	});

	it('function calls with mixed argument types (payload, constant, literal)', async () => {
		const constants = { FACTOR: 2 };
		const input = `stateDiagram-v2
    [*] --> A: toA
    note left of A
      #{result} <= mult($value, %%FACTOR, 3)
    end note`;

		await generateAndSave(
			{
				input,
				automataName: 'Test',
				lang: ModuleNames.JavaScript,
				constants: JSON.stringify(constants),
			},
			'mixedArgumentTypes',
		);
		const res = await import(`./fixtures/generated/mixedArgumentTypes_generated.js`);

		const automata = new res.Test();
		automata.dispatch({
			action: res.actionsDictionary.toA,
			payload: { value: 5 },
		});

		expect(automata.context).toStrictEqual({ result: 30 }); // 5 * 2 * 3 = 30
	});

	it('chained function calls', async () => {
		const input = `stateDiagram-v2
    [*] --> A: toA
    note left of A
      #{result} <= round(mult(add($a, $b), div($c, $d)), 2)
    end note`;

		await generateAndSave({ input, automataName: 'Test', lang: ModuleNames.JavaScript }, 'chainedFunctionCalls');
		const res = await import(`./fixtures/generated/chainedFunctionCalls_generated.js`);

		const automata = new res.Test();
		automata.dispatch({
			action: res.actionsDictionary.toA,
			payload: { a: 2, b: 3, c: 10, d: 3 },
		});

		expect(automata.context).toStrictEqual({ result: 16.67 });
	});

	it('function calls with array operations', async () => {
		const input = `stateDiagram-v2
    [*] --> A: toA
    note left of A
      #{sum} <= sum($numbers=[])
      #{average} <= avg($numbers=[])
      #{maxValue} <= max($numbers=[])
    end note`;

		await generateAndSave({ input, automataName: 'Test', lang: ModuleNames.JavaScript }, 'arrayOperations');
		const res = await import(`./fixtures/generated/arrayOperations_generated.js`);

		const automata = new res.Test();
		automata.dispatch({
			action: res.actionsDictionary.toA,
			payload: { numbers: [1, 2, 3, 4, 5] },
		});

		expect(automata.context).toStrictEqual({
			sum: 15,
			average: 3,
			maxValue: 5,
		});
	});
});

describe('user defined functions', () => {
	it.skip('simple function returning a constant value, define/f () => 3', async () => {
	//	-- skipped test
	// 	const input = `stateDiagram-v2
		// [*] --> A: toA
		// note left of [*]
		//   define/f () => 3
		// end note
		// note left of A
		//   #{result} <= f()
		// end note
		// `;
	// 	await generateAndSave({ input, automataName: 'Test', lang: ModuleNames.JavaScript }, 'constantValueFunction');
	// 	const res = await import(`./fixtures/generated/constantValueFunction_generated.js`);

		// 	const automata = new res.Test();

		// 	automata.dispatch({ action: res.actionsDictionary.toA, payload: {} });

	// 	expect(automata.context).toStrictEqual({ result: 3 });
	});
	it(`codegen should catch cyclic dependencies and throw an error
			define/lol1 () => kek1()
			define/kek1 () => kek2()
			define/kek2 () => kek3()
			define/kek3 () => kek4()
			define/kek4 () => kek5()
			define/kek5 () => kek6()
			define/kek6 () => lol1()
		`, async () => {
		const input = `stateDiagram-v2
		[*] --> A: toA
		A --> B: toB
		note left of [*]
			define/lol1 () => kek1()
			define/kek1 () => kek2()
			define/kek2 () => kek3()
			define/kek3 () => kek4()
			define/kek4 () => kek5()
			define/kek5 () => kek6()
			define/kek6 () => lol1()
		end note
		`;

		await expect(
			generateAndSave({ input, automataName: 'Test', lang: ModuleNames.JavaScript }, 'cyclicDependencies'),
		).rejects.toThrowError();
	});
	it(`the order in which the function is defined has no effect
			define/kek2 () => add(1,2)
			define/lol2 () => kek2()
`, async () => {
		const input = `stateDiagram-v2
		[*] --> A: toA
		A --> B: toB
		note left of [*]
			define/lol2 () => kek2()
			define/kek2 () => add(1,2)

		end note
		note left of A
			#{a=lol2()}
		end note
		`;
		await generateAndSave({ input, automataName: 'Test', lang: ModuleNames.JavaScript }, 'functionOrder');
		const res = await import(`./fixtures/generated/functionOrder_generated.js`);

		const automata = new res.Test();

		automata.dispatch({ action: res.actionsDictionary.toA, payload: {} });

		expect(automata.context).toStrictEqual({ a: 3 });
	});
	it('without arguments in a defined function, define/lol3 () => add(1,2)', async () => {
		const input = `stateDiagram-v2
		[*] --> A: toA
		A --> B: toB
		note left of [*]
			define/lol3 () => add(1,2)
		end note
		note left of A
			#{a=lol3()}
		end note
		`;
		await generateAndSave({ input, automataName: 'Test', lang: ModuleNames.JavaScript }, 'withoutArguments');
		const res = await import(`./fixtures/generated/withoutArguments_generated.js`);

		const automata = new res.Test();

		automata.dispatch({ action: res.actionsDictionary.toA, payload: {} });

		expect(automata.context).toStrictEqual({ a: 3 });
	});
	it('with arguments in a defined function, define/lol4 (a,b) => add(a,b)', async () => {
		const input = `stateDiagram-v2
		[*] --> A: toA
		A --> B: toB
		note left of [*]
			define/lol4 (a,b) => add(a,b)
		end note
		note left of A
			#{a=lol4(1,2)}
		end note
		`;
		await generateAndSave({ input, automataName: 'Test', lang: ModuleNames.JavaScript }, 'withArguments');
		const res = await import(`./fixtures/generated/withArguments_generated.js`);

		const automata = new res.Test();

		automata.dispatch({ action: res.actionsDictionary.toA, payload: {} });

		expect(automata.context).toStrictEqual({ a: 3 });
	});
	it(`with arguments and  value,  define/lol5 (a) => add(a,3) `, async () => {
		const input = `stateDiagram-v2
		[*] --> A: toA
		A --> B: toB
		note left of [*]
			define/lol5 (a) => add(a,3)
		end note
		note left of A
			#{a=lol5(1,2)}
		end note
		`;
		await generateAndSave({ input, automataName: 'Test', lang: ModuleNames.JavaScript }, 'withArgumentsAndDefaultValue');
		const res = await import(`./fixtures/generated/withArgumentsAndDefaultValue_generated.js`);

		const automata = new res.Test();

		automata.dispatch({ action: res.actionsDictionary.toA, payload: {} });

		expect(automata.context).toStrictEqual({ a: 4 });
	});
	it('complex function with constants, define/complexFunc (x, y) => add(mult(%%BASE, x), mult(%%MULTIPLIER, y), %%OFFSET)', async () => {
		const constants = {
			BASE: 10,
			MULTIPLIER: 2,
			OFFSET: 5,
		};

		const input = `stateDiagram-v2
        [*] --> A: toA
        A --> B: toB
        note left of [*]
            define/complexFunc (x, y) => add(mult(%%BASE, x), mult(%%MULTIPLIER, y), %%OFFSET)
        end note
        note left of A
            #{result} <= complexFunc($value1, $value2)
        end note
    `;

		await generateAndSave(
			{
				input,
				automataName: 'Test',
				lang: ModuleNames.JavaScript,
				constants: JSON.stringify(constants),
			},
			'complexFunctionWithConstants',
		);

		const res = await import(`./fixtures/generated/complexFunctionWithConstants_generated.js`);

		const automata = new res.Test();

		automata.dispatch({
			action: res.actionsDictionary.toA,
			payload: { value1: 3, value2: 4 },
		});

		// Expected result: (10 * 3) + (2 * 4) + 5 = 30 + 8 + 5 = 43
		expect(automata.context).toStrictEqual({ result: 43 });
	});

	it('function with passed previous context and payload', async () => {
		const input = `stateDiagram-v2
        [*] --> A: toA
        A --> B: toB
        note left of [*]
            define/addAndMultiply (a, b, c) => mult(add(a, b), c)
            #{initialValue=10}
        end note
        note left of A
            #{result} <= addAndMultiply(#initialValue, $valueFromPayload, %%MULTIPLIER)
        end note
        note left of B
            #{finalResult} <= add(#result, 5)
        end note
        `;

		const constants = {
			MULTIPLIER: 2,
		};

		await generateAndSave(
			{
				input,
				automataName: 'Test',
				lang: ModuleNames.JavaScript,
				constants: JSON.stringify(constants),
			},
			'functionWithPreviousContextAndPayload',
		);

		const res = await import(`./fixtures/generated/functionWithPreviousContextAndPayload_generated.js`);

		const automata = new res.Test();

		automata.dispatch({
			action: res.actionsDictionary.toA,
			payload: { valueFromPayload: 5 },
		});

		// Expected result: (10 + 5) * 2 = 30
		expect(automata.context).toStrictEqual({ result: 30 });

		automata.dispatch({
			action: res.actionsDictionary.toB,
			payload: {},
		});

		// Expected final result: 30 + 5 = 35
		expect(automata.context).toStrictEqual({ finalResult: 35 });
	});
});
