import { createStateDiagram, parseStateDiagram } from '@yantrix/mermaid-parser';
import { toTypedObject } from './utils.js';
import { set } from 'lodash-es';
import type { ICodegenOptions } from './types.js';

export const generate = async (diagram: string, options: ICodegenOptions) => {
	const stateDiagramStructure = await parseStateDiagram(diagram);
	const stateDiagram = await createStateDiagram(stateDiagramStructure);

	const states = {};
	const actions = {};

	for (const state of stateDiagram.states) {
		set(states, state.id, state.id);

		for (const actionPath of state.actionsPath) {
			for (const action of actionPath.action) {
				set(actions, action, action);
			}
		}
	}

	const typedState = toTypedObject(states, 'state');
	const typedAction = toTypedObject(actions, 'action');

	return `
		import { createAutomata } from "@yantrix/automata";

		${typedState.codeBlock}
		${typedAction.codeBlock}

		class ${options.className} extends createAutomata<
			${typedState.typeName},
			${typedAction.typeName},
			any,
			any,
			any,
			any
		> {
			constructor() {
				super();
				this.init({
					state: null,
					context: { index: -1 },
					rootReducer: ({ action, context, payload, state }) => {
						if (!action || payload === null) return { state, context };
						const ctx = {}
						return { state: null, context: null};
					},
					stateValidator: () => {},
					actionValidator: () => {},
					eventValidator: () => {},
				});
			}
		}
	`;
};
