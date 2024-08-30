import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { randomArray, randomDecimal, randomInteger, randomString } from '@yantrix/utils';
import { beforeAll, describe, expect, it } from 'vitest';
import { mapFromObjectToString, objectKeysToString, saveAndGenerate } from './fixtures/utils';
import { constant, generateAssignCase, getReferenceAssign } from './fixtures/defaultAssign';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const getGeneratedFixturePath = (name: string) => path.resolve(__dirname, 'fixtures/generated', name);

function getTemplate(secondNote: string, firstNote?: string) {
	return `stateDiagram-v2
		[*] --> A: toA
		A --> B: toB
		${
	firstNote
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
			// @ts-expect-error idk
			acc.prevContext[el.ident] = el.value;

			if (el.referenceType === 'payload') {
				// @ts-expect-error idk
				acc.dispatchObject[el?.payloadIdent] = el.value;
			}

			return acc;
		},
		{ prevContext: {}, dispatchObject: {} },
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
	const defautlAssignLeft = generateAssignCase(input, 'LeftAssign', defaultSuite);
	const defautlAssignRightContext = generateAssignCase(inputContext, 'RightAssignPreviousContext', defaultSuite);
	const defaultAssignRightPayload = generateAssignCase(inputPayload, 'RightAssignPayload', defaultSuite);

	/*
	With payload and previous context, all expressions
	constant = pi = 3.14
	*/

	const defaultAssignLeftPrevious = getTemplateWithPreviousContext();

	const res = [defautlAssignLeft, defautlAssignRightContext, defaultAssignRightPayload];

	const notesWithTemplate = res.map((el) => {
		return { ...el, input: getTemplateInput(el.input) };
	});
	const allNotes = [...notesWithTemplate, defaultAssignLeftPrevious];

	beforeAll(async () => {
		for (const note of allNotes) {
			const input = note.input;

			await saveAndGenerate(
				{ input, automataName: 'Test', lang: 'JavaScript', constants: JSON.stringify(constant) },
				note.name,
			);
		}
	});

	it('left assign #{a=string | constant | number | list  | emptyPayload = {} | emptypreviousContext = {} }', async () => {
		const { output, dispatchObject } = defautlAssignLeft;

		const res = await import(getGeneratedFixturePath('LeftAssign_generated.js'));

		const automata = new res.Test();
		automata.dispatch({ action: res.actionsDictionary.toA, payload: dispatchObject });

		expect(automata.context).toStrictEqual(output);
	});
	it('left assign with previous context and payload #{ a=$payload, $b=#prevContext } prevContext - all expressions', async () => {
		const { output, dispatchObject } = defaultAssignLeftPrevious;

		const res = await import(getGeneratedFixturePath('LeftAsssignWithPreviusReference_generated.js'));

		const automata = new res.Test();
		automata.dispatch({ action: res.actionsDictionary.toA, payload: dispatchObject });
		automata.dispatch({ action: res.actionsDictionary.toB, payload: {} });

		expect(automata.context).toStrictEqual(output);
	});
	it('right assign with #a,#b = (list, constant, integer, string, payload = {}, prevContext = {})', async () => {
		const { output, dispatchObject } = defautlAssignRightContext;

		const res = await import(getGeneratedFixturePath('RightAssignPreviousContext_generated.js'));

		const automata = new res.Test();
		automata.dispatch({ action: res.actionsDictionary.toA, payload: dispatchObject });

		expect(automata.context).toStrictEqual(output);
	});

	it('right assign payload $a,$b = (list, constant, integer, string, payload = {}, prevContext = {}', async () => {
		const { output, dispatchObject } = defaultAssignRightPayload;

		const res = await import(getGeneratedFixturePath('RightAssignPayload_generated.js'));

		const automata = new res.Test();
		automata.dispatch({ action: res.actionsDictionary.toA, payload: dispatchObject });

		expect(automata.context).toStrictEqual(output);
	});
	it('in the function call #{a} <= add($a=10, $b=5)', async () => {
		const note = `#{a} <= add($a=10, $b=5)`;
		const input = getTemplateInput(note);

		await saveAndGenerate({ input, automataName: 'Test', lang: 'JavaScript' }, 'functionDefaultAssign');

		const res = await import(getGeneratedFixturePath('functionDefaultAssign_generated.js'));

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

		await saveAndGenerate({ input, automataName: 'Test', lang: 'JavaScript' }, 'shortcutContext');
		const res = await import(getGeneratedFixturePath('shortcutContext_generated.js'));

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

		await saveAndGenerate({ input, automataName: 'Test', lang: 'JavaScript' }, 'shortcutContextWithNull');
		const res = await import(getGeneratedFixturePath('shortcutContextWithNull_generated.js'));

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

		await saveAndGenerate({ input, automataName: 'Test', lang: 'JavaScript' }, 'defaultContext');
		const res = await import(getGeneratedFixturePath('defaultContext_generated.js'));

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

		await saveAndGenerate({ input, automataName: 'Test', lang: 'JavaScript' }, 'nullContextFull');
		const res = await import(getGeneratedFixturePath('nullContextFull_generated.js'));

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

		await saveAndGenerate({ input, automataName: 'Test', lang: 'JavaScript' }, 'payloadBase');
		const res = await import(getGeneratedFixturePath('payloadBase_generated.js'));

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

		await saveAndGenerate(
			{ input: getTemplate(input), automataName: 'Test', lang: 'JavaScript' },
			'payloadWithEmptyObject',
		);
		const res = await import(getGeneratedFixturePath('payloadWithEmptyObject_generated.js'));

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

		await saveAndGenerate(
			{ input: getTemplate(input), automataName: 'Test', lang: 'JavaScript' },
			'expressionReducer',
		);
		const res = await import(getGeneratedFixturePath('expressionReducer_generated.js'));

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

		await saveAndGenerate({ input: test, automataName: 'Test', lang: 'JavaScript' }, 'functionCall');
		const res = await import(getGeneratedFixturePath('functionCall_generated.js'));

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

		await saveAndGenerate(
			{
				input: getTemplateInput(input),
				automataName: 'Test',
				lang: 'JavaScript',
				constants: JSON.stringify(constants),
			},
			'constants',
		);

		const res = await import(getGeneratedFixturePath('constants_generated.js'));
		const automata = new res.Test();

		automata.dispatch({ action: res.actionsDictionary.toA, payload: {} });

		expect(automata.context).toStrictEqual(output);
	});
	it('constant value should be number or string', async () => {
		const invalid = {
			a: [],
			b: { a: 3 },
			c: () => {},
		};

		Object.entries(invalid).forEach(async ([key, value]) => {
			const call = async () => {
				await saveAndGenerate(
					{
						input: getTemplateInput(`#{a,b,c} <= %%i1, %%i2, %%i3`),
						automataName: 'Test',
						lang: 'JavaScript',
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
			await saveAndGenerate(
				{
					input: getTemplateInput(input),
					automataName: 'Test',
					lang: 'JavaScript',
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
			await saveAndGenerate(
				{
					input: getTemplateInput(input),
					automataName: 'Test',
					lang: 'JavaScript',
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
		await saveAndGenerate({ input, automataName: 'Test', lang: 'JavaScript' }, 'qwerty');
		const res = await import(getGeneratedFixturePath('qwerty_generated.js'));

		const automata = new res.Test();

		expect(automata.state).toBe(res.statesDictionary.A);
	});
	it('by default start state should be first state in note', async () => {
		const input = `stateDiagram-v2
		C --> A: a
		A --> F: t
		`;

		await saveAndGenerate({ input, automataName: 'Test', lang: 'JavaScript' }, 'defaultStartState');
		const res = await import(getGeneratedFixturePath('defaultStartState_generated.js'));

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

		await saveAndGenerate({ input, automataName: 'Test', lang: 'JavaScript' }, 'tata');
		const res = await import(getGeneratedFixturePath('tata_generated.js'));

		const automata = new res.Test();

		automata.dispatch({ action: res.actionsDictionary.toC, payload: {} });

		expect(automata.context).toStrictEqual(output);
	});
	it('by default, the context should be empty object', async () => {
		await saveAndGenerate(
			{
				input: `stateDiagram-v2
					[*] --> C: toC
					`,
				automataName: 'Test',
				lang: 'JavaScript',
			},
			'defaultContextEmptyObject',
		);
		const res = await import(getGeneratedFixturePath('defaultContextEmptyObject_generated.js'));

		const automata = new res.Test();

		expect(automata.context).toStrictEqual({});
	});
});

describe('functions', () => {
	it('nested call, mult(avg($list),$count)', async () => {
		const input = `#{a} <= mult(avg($list),$count)`;
		await saveAndGenerate(
			{
				input: getTemplateInput(input),
				automataName: 'Test',
				lang: 'JavaScript',
			},
			'nestedCallFunction',
		);

		const res = await import(getGeneratedFixturePath('nestedCallFunction_generated.js'));

		const automata = new res.Test();

		automata.dispatch({ action: res.actionsDictionary.toA, payload: { list: [1, 2, 4, 1], count: 2 } });

		expect(automata.context).toStrictEqual({ a: 4 });
	});
});
