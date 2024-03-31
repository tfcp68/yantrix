import type { TStateDiagram } from '@yantrix/mermaid-parser';
import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import { toTypedObject } from './utils.js';
import type { ICodegenOptions } from './types.js';

export const generate = async (
	diagram: TStateDiagram,
	options: ICodegenOptions,
) => {
	const states = new BasicStateDictionary();
	const actions = new BasicActionDictionary();

	const stateKeys = diagram.states.map((s) => s.id);

	states.addStates({ keys: stateKeys, namespace: 'states1' });

	for (const state of diagram.states) {
		for (const actionPath of state.actionsPath) {
			actions.addActions({ keys: actionPath.action });
		}
	}

	const typedState = toTypedObject(states, 'state');
	const typedAction = toTypedObject(actions, 'action');

	return `
		import { GenericAutomata } from "@yantrix/automata";

		${typedState.codeBlock}
		${typedAction.codeBlock}

		class ${options.className} extends GenericAutomata {
			public constructor() {
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
