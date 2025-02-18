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
		returnedValueExpectedFunction: (...payloads) => payloads.reduce((acc, v) => acc + v),
	}),
	generateTemplate({
		function_name: 'add',
		returnedValueExpectedFunction: (...payloads) => payloads.reduce((acc, v) => acc + v),
		payloadsCount: 10,
	}),
	generateTemplate({
		function_name: 'diff',
		returnedValueExpectedFunction: (v1, v2) => v1 - v2,
	}),
	generateTemplate({
		function_name: 'mult',
		returnedValueExpectedFunction: (...payloads) => payloads.reduce((acc, v) => acc * v),
	}),
	generateTemplate({
		function_name: 'mult',
		returnedValueExpectedFunction: (...payloads) => payloads.reduce((acc, v) => acc * v),
		payloadsCount: 10,
	}),
	generateTemplate({
		function_name: 'div',
		returnedValueExpectedFunction: (v1, v2) => v1 / v2,
	}),
	// generateTemplate({
	// 	function_name: 'pow',
	// 	returnedValueExpectedFunction: (v1, v2) => v1 ** v2,
	// }),
	generateTemplate({
		function_name: 'inc',
		returnedValueExpectedFunction: v1 => v1 + 1,
	}),
	generateTemplate({
		function_name: 'dec',
		returnedValueExpectedFunction: v1 => v1 - 1,
	}),
	generateTemplate({
		function_name: 'neg',
		returnedValueExpectedFunction: v1 => -v1,
	}),
	generateTemplate({
		function_name: 'inv',
		returnedValueExpectedFunction: v1 => 1 / v1,
	}),
	generateTemplate({
		function_name: 'mod',
		returnedValueExpectedFunction: (v1, v2) => v1 % v2,
	}),
	generateTemplate({
		function_name: 'trunc',
		returnedValueExpectedFunction: v1 => Math.trunc(v1),
	}),
	generateTemplate({
		function_name: 'ceil',
		returnedValueExpectedFunction: v1 => Math.ceil(v1),
	}),
	generateTemplate({
		function_name: 'round',
		returnedValueExpectedFunction: v1 => Math.round(v1),
	}),
];

export default templates;
