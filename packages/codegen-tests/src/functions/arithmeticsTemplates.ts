import { builtInFunctions } from '@yantrix/functions';
import { sampleRange } from '@yantrix/utils';
import { expect } from 'vitest';
import { TTemplate, TTestIteration } from './types';

const generateTemplate = (props: {
	function_name: string;
	returnedValueExpectedFunction: (...payloads: number[]) => number;
	payloadsCount?: number;
}) => {
	props.payloadsCount = props?.payloadsCount || 2;

	let payloadStr = '(';

	for (let i = 1; i <= props.payloadsCount; i++) {
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
		automataName: `${props.function_name}_function_with_${props.payloadsCount}_payloads`,
		getTestIterations: (module) => {
			const tests = [] as TTestIteration[];

			tests.push({
				function: async () => {
					for (let i = 0; i < 100; i++) {
						const payloads = [];
						for (let i = 1; i <= props.payloadsCount!; i++) {
							payloads.push(sampleRange(-1000, 1000));
						}

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
						const expectedResult = props.returnedValueExpectedFunction(...payloads);
						expect(automata.context.ReturnedValue).toBe(expectedResult);
					}
				},
				name: 'must pass equal tests',
			});

			return tests;
		},
	};
	return template;
};

const templates: TTemplate[] = [
	generateTemplate({
		function_name: 'add',
		returnedValueExpectedFunction: builtInFunctions.add,
	}),
	generateTemplate({
		function_name: 'add',
		returnedValueExpectedFunction: builtInFunctions.add,
		payloadsCount: 10,
	}),
	generateTemplate({
		function_name: 'diff',
		returnedValueExpectedFunction: builtInFunctions.diff,
	}),
	generateTemplate({
		function_name: 'mult',
		returnedValueExpectedFunction: builtInFunctions.mult,
	}),
	generateTemplate({
		function_name: 'mult',
		returnedValueExpectedFunction: builtInFunctions.mult,
		payloadsCount: 10,
	}),
	generateTemplate({
		function_name: 'div',
		returnedValueExpectedFunction: builtInFunctions.div,
	}),
	generateTemplate({
		function_name: 'pow',
		returnedValueExpectedFunction: builtInFunctions.pow,
	}),
	generateTemplate({
		function_name: 'inc',
		returnedValueExpectedFunction: builtInFunctions.inc,
	}),
	generateTemplate({
		function_name: 'dec',
		returnedValueExpectedFunction: builtInFunctions.dec,
	}),
	generateTemplate({
		function_name: 'neg',
		returnedValueExpectedFunction: builtInFunctions.neg,
	}),
	generateTemplate({
		function_name: 'inv',
		returnedValueExpectedFunction: builtInFunctions.inv,
	}),
	generateTemplate({
		function_name: 'mod',
		returnedValueExpectedFunction: builtInFunctions.mod,
	}),
	generateTemplate({
		function_name: 'trunc',
		returnedValueExpectedFunction: builtInFunctions.trunc,
	}),
	generateTemplate({
		function_name: 'ceil',
		returnedValueExpectedFunction: builtInFunctions.ceil,
	}),
	generateTemplate({
		function_name: 'round',
		returnedValueExpectedFunction: builtInFunctions.round,
	}),
];

export default templates;
