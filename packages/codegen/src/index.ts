import { createStateDiagram, parseStateDiagram } from '@yantrix/mermaid-parser';
import { toTypedObjectBlock, toTypedObjectProps } from './utils.js';
import { set } from 'lodash-es';

const diagram = `
	stateDiagram-v2

	state ChoiceState1 <<choice>>
	state ChoiceState2 <<choice>>

	[*] --> A
	A --> ChoiceState1
	ChoiceState1 --> ChoiceState2
	ChoiceState1 --> B
	ChoiceState2 --> B
	ChoiceState2 --> D
	B --> [*]
	D --> [*]

	note left of ChoiceState1
		this is multiline
		comment left of
		first choice
	end note

	note right of ChoiceState2
		this is another
		multiline comment
		right of second choice
	end note`;

export const generate = async () => {
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

	const typedStateObjectBlock = toTypedObjectBlock(states, 'state');
	const typedActionObjectBlock = toTypedObjectBlock(actions, 'action');
	const typedStateObjectProps = toTypedObjectProps(states, 'state');
	const typedActionObjectProps = toTypedObjectProps(actions, 'action');

	return `
		${typedStateObjectBlock}
		${typedActionObjectBlock}

		class GeneratedAutomata extends createAutomata<
			${typedStateObjectProps.typeName},
			${typedActionObjectProps.typeName},
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
						return {
							state: null,
							context: null,
						};
					},
					stateValidator: () => {},
					actionValidator: () => {},
					eventValidator: () => {},
				});
			}
		}
	`;
};
