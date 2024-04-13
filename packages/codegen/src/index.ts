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
	states.addStates({ keys: stateKeys, namespace: 'states' });

	for (const state of diagram.states) {
		const paths = state.actionsPath.map((p) => p.action);

		for (const [idx, path] of paths.entries()) {
			const namespace = `actions-${state.id}-${idx}`;
			actions.addActions({ keys: path, namespace });
		}
	}

	// console.log(states.getDictionary());
	// console.log(actions.getDictionary());
	const stateDict = states.getDictionary();
	const actionDict = actions.getDictionary();

	const typedState = toTypedObject(stateDict, 'state');
	const typedAction = toTypedObject(actionDict, 'action');

	return `
		import { GenericAutomata } from "@yantrix/automata";

		${typedState.codeBlock}

		${typedAction.codeBlock}

		export class ${options.className} extends GenericAutomata {
			public constructor() {
				super();
				this.init({
					state: Object.values(${typedState.name})[0],
					context: { index: -1 },
					rootReducer: ({ action, context, payload, state }) => {
						if (!action || payload === null) return { state, context };
						const ctx = {}
						return { state: null, context: { index: -1 } };
					},
					stateValidator: () => {},
					actionValidator: () => {},
					eventValidator: () => {},
				});
			}
		}
	`;
};
