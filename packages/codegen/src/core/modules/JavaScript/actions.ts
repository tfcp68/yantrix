import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import { StartState, TDiagramAction } from '@yantrix/mermaid-parser';
import { TStateDiagramMatrixIncludeNotes } from '../../../types/common';

export function getActionToStateDictText(props: {
	transitions: Record<string, TDiagramAction>;
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
}) {
	return Object
		.entries(props.transitions)
		.map(([key, transition]) => {
			const newState = props.stateDictionary.getStateValues({ keys: [key] })[0];
			return transition.actionsPath.map(({ action }) => {
				const actionValue = props.actionDictionary.getActionValues({
					keys: action,
				})[0];
				if (!actionValue) throw new Error(`Action ${action} not found`);
				if (!newState) throw new Error(`State ${key} not found`);

				return `
				  ${actionValue}: {
				  	state: ${newState},
				  },
				`;
			});
		})
		.flatMap(el => `${el.join('\n\t')}`);
}

export function getActionToStateFromStateDict(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
}) {
	const actionToStartStateMatrix: Record<string, TDiagramAction> = {};

	Object.entries(props.diagram.transitions).forEach(([state, transitions]) => {
		if (state === StartState) {
			const entries = Object.entries(transitions);
			entries.forEach(([state, action]) => {
				action.actionsPath.forEach(({ action }) => {
					actionToStartStateMatrix[state] = {
						actionsPath: [{ action, note: [] }],
					};
				});
			});
		}
	});

	const isExistsStartState = Object.keys(actionToStartStateMatrix).length > 0;

	return Object.entries(props.diagram.transitions).map(([state, transitions]) => {
		const value = props.stateDictionary.getStateValues({ keys: [state] })[0];
		if (!value) throw new Error(`State ${state} not found`);
		if (isExistsStartState && state !== StartState) {
			transitions = {
				...transitions,
				...actionToStartStateMatrix,
			};
		}

		return `${value}: {${getActionToStateDictText({
			stateDictionary: props.stateDictionary,
			actionDictionary: props.actionDictionary,
			transitions,
		}).join('\n\t')}},`;
	});
}
