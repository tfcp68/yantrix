import { sampleRange } from '@yantrix/utils';
import { expect } from 'vitest';
import { Constructable } from 'vitest/utils';
import { TTemplate, TTestIteration } from './types';

export const getRandomNumber = () => sampleRange(-10000, 10000);

const generateInputTemplate = (props: {
	functionName: string;
	payloadLength: number;

}) => {
	let payloadStr = '(';

	for (let i = 1; i <= props.payloadLength; i++) {
		payloadStr += `$payload${i}, `;
	}

	payloadStr = `${payloadStr.slice(0, -2)})`;

	return `
			stateDiagram-v2
			[*] --> end: call
			end --> end: call
			note left of end
			#{ ReturnedValue } <= ${props.functionName}${payloadStr}
			end note
		`;
};

export const generateTemplate = (props: {
	functionName: string;
	returnedValueExpectedFunction?: (...payloads: any[]) => any;
	getPayloads: (iteration: number) => any[];
	iterationsCount?: number;
	expectError?: boolean;
	error?: string | Constructable | RegExp | Error;
	description: string;
}) => {
	if (!props.iterationsCount) props.iterationsCount = 100;
	let payloads = props.getPayloads();

	const automataName = props?.expectError
		? `${props.functionName}_function_with_error`
		: `${props.functionName}_function_with_${payloads.length}_payloads`;

	const template: TTemplate = {
		input: generateInputTemplate({
			functionName: props.functionName,
			payloadLength: payloads.length,
		}),
		description: props.description,
		automataName,
		getTestIterations: (module) => {
			const tests = [] as TTestIteration[];

			const testFunction = async () => {
				for (let i = 0; i < props.iterationsCount!; i++) {
					const inner = () => {
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
							expect(automata.context.ReturnedValue, JSON.stringify(payloads)).toStrictEqual(expectedResult);
						}
						payloads = props.getPayloads();
					};

					if (props.expectError) {
						expect(inner, JSON.stringify(payloads)).toThrowError(props.error);
					} else {
						inner();
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
