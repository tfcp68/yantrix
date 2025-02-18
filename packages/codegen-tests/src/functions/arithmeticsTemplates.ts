import { sampleRange } from '@yantrix/utils';
import { expect } from 'vitest';
import { TTemplate, TTestIteration } from './types';

const templates: TTemplate[] = [
	{
		input: `
			stateDiagram-v2
			[*] --> end: call
			end --> end: call
			note left of [*]
			#{ ReturnedValue  = 0}
			end note
			note left of end
			#{ ReturnedValue } <= add(#ReturnedValue, $payload)
			end note
		`,
		description: 'add function',
		automataName: 'add_function_with_payload',
		getTestIterations: (module) => {
			const tests = [] as TTestIteration[];

			tests.push({
				function: async () => {
					for (let i = -5; i < 5; i++) {
						const payload = i < 0 ? sampleRange(-1000, -1) : sampleRange(0, 1000);

						const Automata = module.Automata;
						const automata = new Automata();
						automata.dispatch({
							action: Automata.getAction(Automata.actions.call),
							payload: {
								payload,
							},
						});
						expect(automata.state).toBe(Automata.getState(Automata.states.end));
						expect(automata.context.ReturnedValue).toBe(payload);
					}
				},
				name: `must pass equal tests`,
			});

			return tests;
		},
	},
	{
		input: `
			stateDiagram-v2
			[*] --> end: call
			end --> end: call
			note left of [*]
			#{ ReturnedValue  = 0}
			end note
			note left of end
			#{ ReturnedValue } <= diff(#ReturnedValue, $payload)
			end note
		`,
		description: 'diff function',
		automataName: 'diff_function_with_payload',
		getTestIterations: (module) => {
			const tests = [] as TTestIteration[];
			tests.push({
				function: async () => {
					for (let i = -5; i < 5; i++) {
						const payload = i < 0 ? sampleRange(-1000, -1) : sampleRange(0, 1000);

						const Automata = module.Automata;
						const automata = new Automata();
						automata.dispatch({
							action: Automata.getAction(Automata.actions.call),
							payload: {
								payload,
							},
						});
						expect(automata.state).toBe(Automata.getState(Automata.states.end));
						expect(automata.context.ReturnedValue).toBe(-payload);
					}
				},
				name: `must pass equal tests`,
			});

			return tests;
		},
	},
	{
		input: `
			stateDiagram-v2
			[*] --> end: call
			end --> end: call
			note left of [*]
			#{ ReturnedValue  = 5}
			end note
			note left of end
			#{ ReturnedValue } <= mult(#ReturnedValue, $payload)
			end note
		`,
		description: 'mult function',
		automataName: 'mult_function_with_payload',
		getTestIterations: (module) => {
			const tests = [] as TTestIteration[];

			tests.push({
				function: async () => {
					for (let i = -5; i < 5; i++) {
						const payload = i < 0 ? sampleRange(-1000, -1) : sampleRange(0, 1000);

						const Automata = module.Automata;
						const automata = new Automata();
						automata.dispatch({
							action: Automata.getAction(Automata.actions.call),
							payload: {
								payload,
							},
						});
						expect(automata.state).toBe(Automata.getState(Automata.states.end));
						expect(automata.context.ReturnedValue).toBe(5 * payload);
					}
				},
				name: `must pass equal tests`,
			});

			return tests;
		},
	},
	{
		input: `
			stateDiagram-v2
			[*] --> end: call
			end --> end: call
			note left of end
			#{ ReturnedValue } <= div($payload1, $payload2)
			end note
		`,
		description: 'div function',
		automataName: 'div_function_with_payload',
		getTestIterations: (module) => {
			const tests = [] as TTestIteration[];

			tests.push({
				function: async () => {
					for (let i = 0; i < 10; i++) {
						const payload1 = sampleRange(0, 1000);
						const payload2 = sampleRange(0, 1000);

						const Automata = module.Automata;
						const automata = new Automata();
						automata.dispatch({
							action: Automata.getAction(Automata.actions.call),
							payload: {
								payload1,
								payload2,
							},
						});
						expect(automata.state).toBe(Automata.getState(Automata.states.end));
						expect(automata.context.ReturnedValue, `expected ${automata.context.ReturnedValue} to be ${payload1} / ${payload2} = ${payload1 / payload2}`).toBe(payload1 / payload2);
					}
				},
				name: 'must pass equal tests',
			});

			return tests;
		},
	},
];

export default templates;
