import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import { StartState, TDiagramAction } from '@yantrix/mermaid-parser';
import { TStateDiagramMatrixIncludeNotes } from '../../../../../types/common';
import { getObjectKeysMap } from './core';
import { TActionToStateEntryModel, TActionToStateFromStateModel, TDictionaries } from './types';

function getActionToStateDictModel(props: {
	transitions: Record<string, TDiagramAction>;
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
}): Record<number, TActionToStateEntryModel> {
	const dict: Record<number, number[]> = {};

	Object.entries(props.transitions).forEach(([key, transition]) => {
		const newState = props.stateDictionary.getStateValues({ keys: [key] })[0];

		transition.actionsPath.forEach(({ action }) => {
			const actionValue = props.actionDictionary.getActionValues({ keys: action })[0];
			if (actionValue == null) throw new Error(`Action ${action} not found`);
			if (newState == null) throw new Error(`State ${key} not found`);

			if (dict[actionValue] == null) {
				dict[actionValue] = [];
			}
			if (!dict[actionValue]!.includes(newState)) {
				dict[actionValue]!.push(newState);
			}
		});
	});

	return Object.fromEntries(
		Object.entries(dict).map(([actionId, possibleStates]) => {
			const numericActionId = Number(actionId);
			return [numericActionId, {
				state: possibleStates,
				withPredicate: possibleStates.length > 1,
			}];
		}),
	);
}

export function getActionToStateFromStateModel(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
}): TActionToStateFromStateModel {
	const actionToStartStateMatrix: Record<string, TDiagramAction> = {};

	Object.entries(props.diagram.transitions).forEach(([state, transitions]) => {
		if (state === StartState) {
			Object.entries(transitions).forEach(([targetState, action]) => {
				action.actionsPath.forEach(({ action }) => {
					actionToStartStateMatrix[targetState] = {
						actionsPath: [{ action, note: [] }],
					};
				});
			});
		}
	});

	const model: TActionToStateFromStateModel = {};

	Object.entries(props.diagram.transitions).forEach(([currentState, transitions]) => {
		const transitionsWithStartState = { ...transitions };
		for (const [targetState, startAction] of Object.entries(actionToStartStateMatrix)) {
			if (transitionsWithStartState[targetState]) {
				transitionsWithStartState[targetState] = {
					actionsPath: [
						...transitionsWithStartState[targetState]!.actionsPath,
						...startAction.actionsPath,
					],
				};
			} else {
				transitionsWithStartState[targetState] = startAction;
			}
		}

		const stateId = props.stateDictionary.getStateValues({ keys: [currentState] })[0];
		if (stateId == null) throw new Error(`State ${currentState} not found`);

		model[stateId] = getActionToStateDictModel({
			transitions: transitionsWithStartState,
			stateDictionary: props.stateDictionary,
			actionDictionary: props.actionDictionary,
		});
	});

	return model;
}

export function getDictionariesCode(props: {
	dictionaries: TDictionaries;
}): string {
	return props.dictionaries.join('\n');
}

export function getActionsMapModel(props: {
	actionDictionary: BasicActionDictionary;
}) {
	return getObjectKeysMap(props.actionDictionary.getDictionary());
}

export function getStatesMapModel(props: {
	stateDictionary: BasicStateDictionary;
}) {
	return getObjectKeysMap(props.stateDictionary.getDictionary());
}

export const dictionariesSerializer = {
	getActionToStateFromStateModel,
	getDictionariesCode,
	getActionsMapModel,
	getStatesMapModel,
} as const;
