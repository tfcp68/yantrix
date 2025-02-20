import { builtInFunctions } from '@yantrix/functions';
import { sampleRange } from '@yantrix/utils';
import { expect } from 'vitest';
import { Constructable } from 'vitest/utils.js';
import { TTemplate, TTestIteration } from './types';

const getRandomNumber = () => sampleRange(-10000, 10000);

const generateTemplate = <T>(props: {
	function_name: string;
	returnedValueExpectedFunction?: (...payloads: T[]) => any;
	getPayloads: (iteration: number) => T[];
	iterationsCount?: number;
	expectError?: boolean;
	error?: string | Constructable | RegExp | Error;
}) => {
	if (!props.iterationsCount) props.iterationsCount = 100;
	let payloads = props.getPayloads(0);
	let payloadStr = '(';

	for (let i = 1; i <= payloads.length; i++) {
		payloadStr += `$payload${i}, `;
	}

	payloadStr = `${payloadStr.slice(0, -2)})`;

	const template: TTemplate = {
		input: `
			stateDiagram-v2
			[*] --> end: call
			end --> end: call
			note left of end
			#{ ReturnedValue } <= ${props.function_name}${payloadStr}
			end note
		`,
		description: `${props.function_name} function`,
		automataName: `${props.function_name}_function_with_${payloads.length}_payloads`,
		getTestIterations: (module) => {
			const tests = [] as TTestIteration[];

			const testFunction = async () => {
				for (let i = 0; i < props.iterationsCount!; i++) {
					const inner = async () => {
						const Automata = module.Automata;
						const automata = new Automata();
						automata.dispatch({
							action: Automata.getAction(Automata.actions.call),
							payload: payloads.reduce((previousValue, currentValue, currentIndex) => ({
								...previousValue,
								[`payload${currentIndex + 1}`]: currentValue,
							}), {}),
						});
						expect(automata.state).toBe(Automata.getState(Automata.states.end));
						if (props.returnedValueExpectedFunction) {
							const expectedResult = props.returnedValueExpectedFunction(...payloads);
							expect(automata.context.ReturnedValue, JSON.stringify(payloads)).toBe(expectedResult);
						}
						payloads = props.getPayloads(i);
					};

					if (props.expectError) {
						await expect(inner).rejects.toThrowError(props.error);
					} else {
						await inner();
					}
				}
			};

			tests.push({
				function: testFunction,
				name: props.expectError ? 'must throw error' : 'must pass equal tests',
			});

			return tests;
		},
	};
	return template;
};

const templates: TTemplate[] = [
	generateTemplate({
		function_name: 'add',
		returnedValueExpectedFunction: (...n) => builtInFunctions.add(n),
		getPayloads: () => Array.from({ length: 2 }, () => getRandomNumber()),
	}),
	generateTemplate({
		function_name: 'add',
		returnedValueExpectedFunction: builtInFunctions.add,
		getPayloads: () => Array.from({ length: 10 }, () => getRandomNumber()),
	}),
	generateTemplate({
		function_name: 'diff',
		returnedValueExpectedFunction: builtInFunctions.diff,
		getPayloads: () => ([getRandomNumber(), getRandomNumber()]),
	}),
	generateTemplate({
		function_name: 'mult',
		returnedValueExpectedFunction: builtInFunctions.mult,
		getPayloads: () => ([getRandomNumber(), getRandomNumber()]),
	}),
	generateTemplate({
		function_name: 'mult',
		returnedValueExpectedFunction: builtInFunctions.mult,
		getPayloads: () => Array.from({ length: 10 }, () => getRandomNumber()),
	}),
	generateTemplate({
		function_name: 'div',
		returnedValueExpectedFunction: builtInFunctions.div,
		getPayloads: () => ([getRandomNumber(), getRandomNumber()]),
	}),
	generateTemplate({
		function_name: 'pow',
		returnedValueExpectedFunction: builtInFunctions.pow,
		getPayloads: () => ([getRandomNumber(), getRandomNumber()]),
	}),
	generateTemplate({
		function_name: 'inc',
		returnedValueExpectedFunction: builtInFunctions.inc,
		getPayloads: () => ([getRandomNumber(), getRandomNumber()]),
	}),
	generateTemplate({
		function_name: 'dec',
		returnedValueExpectedFunction: builtInFunctions.dec,
		getPayloads: () => ([getRandomNumber(), getRandomNumber()]),
	}),
	generateTemplate({
		function_name: 'neg',
		returnedValueExpectedFunction: builtInFunctions.neg,
		getPayloads: () => ([getRandomNumber(), getRandomNumber()]),
	}),
	generateTemplate({
		function_name: 'inv',
		returnedValueExpectedFunction: builtInFunctions.inv,
		getPayloads: () => ([getRandomNumber(), getRandomNumber()]),
	}),
	generateTemplate({
		function_name: 'mod',
		returnedValueExpectedFunction: builtInFunctions.mod,
		getPayloads: () => ([getRandomNumber(), getRandomNumber()]),
	}),
	generateTemplate({
		function_name: 'trunc',
		returnedValueExpectedFunction: builtInFunctions.trunc,
		getPayloads: () => ([getRandomNumber(), getRandomNumber()]),
	}),
	generateTemplate({
		function_name: 'ceil',
		returnedValueExpectedFunction: builtInFunctions.ceil,
		getPayloads: () => ([getRandomNumber(), getRandomNumber()]),
	}),
	generateTemplate({
		function_name: 'round',
		getPayloads: () => ([getRandomNumber(), getRandomNumber()]),
	}),

	generateTemplate({
		function_name: 'pow',
		getPayloads: () => ([getRandomNumber(), 'asfasf']),
		expectError: true,
		error: TypeError,
	}),
];

export default templates;
