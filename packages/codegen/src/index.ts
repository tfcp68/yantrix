import { createStateDiagram, parseStateDiagram } from '@yantrix/mermaid-parser';
import { GenericAutomata } from '@yantrix/automata';
import { TStateDiagram } from '../../mermaid-parser/dist/state/types/stateDiagramTypes.js';

const diagram = `
	stateDiagram-v2

	[*] --> A
	A --> B
	B --> [*]`;

export const generate = async () => {
	const stateDiagramStructure = await parseStateDiagram(diagram);
	const stateDiagram = await createStateDiagram(stateDiagramStructure);

	const stateType = toUnion(stateDiagram.states, 'state');
	const actionRowTypes = stateDiagram.states.flatMap((s) => {
		if (!s.actionsPath.length) return [];

		return s.actionsPath.flatMap((p) => p.action);
	});

	const actionType = toUnion(actionRowTypes, 'action');

	return `
		const states = ${JSON.stringify(stateDiagram.states, null, 2)};

		${stateType}
		${actionType}

		function isValidState(obj: any): obj is TState {
			return states.includes(obj)
		}
	`;
};

function toUnion<T extends {}>(array: T[], name: string) {
	const union = array.map((item) => JSON.stringify(item, null)).join(' | ');

	return `type T${toUpperFirst(name)} = ${union}`;
}

function toUpperFirst(str: string) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}
