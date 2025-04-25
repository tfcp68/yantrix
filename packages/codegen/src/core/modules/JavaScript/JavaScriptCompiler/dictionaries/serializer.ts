import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import { StartState, TDiagramAction } from '@yantrix/mermaid-parser';
import { TStateDiagramMatrixIncludeNotes } from '../../../../../types/common';
import { getObjectKeysMap } from './core';
import { TDictionaries } from './types';

export function getActionToStateDict(props: {
	transitions: Record<string, TDiagramAction>;
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
	currentState: number;
}) {
	const dict: Record<number, number[]> = {};

	// group all possible states for an action in the dict object
	Object
		.entries(props.transitions)
		.forEach(([key, transition]) => {
			const newState = props.stateDictionary.getStateValues({ keys: [key] })[0];

			transition.actionsPath.forEach(({ action }) => {
				const actionValue = props.actionDictionary.getActionValues({
					keys: action,
				})[0];
				if (!actionValue) throw new Error(`Action ${action} not found`);
				if (!newState) throw new Error(`State ${key} not found`);

				if (!dict[actionValue]) {
					dict[actionValue] = [];
				}
				if (!dict[actionValue].includes(newState)) {
					dict[actionValue].push(newState);
				}
			});
		});

	// if there is more than 1 possible state => insert predicate function using currentState and currentAction IDs
	const res = Object.entries(dict).map(([actionId, possibleStates]) => {
		const predicateString = (possibleStates.length > 1) ? `,\npredicate: predicates[${props.currentState}][${actionId}]` : '';
		return `
				${actionId}: {
					state: [${possibleStates}]${predicateString}
				}
			`;
	}).join(',\n');

	return res;
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

	return Object.entries(props.diagram.transitions).map(([currentState, transitions]) => {
		const transitionsWithStartState = {
			...transitions,
			...actionToStartStateMatrix,
		};

		const value = props.stateDictionary.getStateValues({ keys: [currentState] })[0];
		if (!value) throw new Error(`State ${currentState} not found`);

		return `${value}: {${getActionToStateDict({
			currentState: value,
			transitions: transitionsWithStartState,
			stateDictionary: props.stateDictionary,
			actionDictionary: props.actionDictionary,
		}).concat('\n\t')}},`;
	});
}

export function getDictionariesCode(props: {
	dictionaries: TDictionaries;
}): string {
	return props.dictionaries.join('\n');
}

export function getActionsMap(props: {
	actionDictionary: BasicActionDictionary;
}) {
	return `const actionsMap = ${JSON.stringify(getObjectKeysMap(props.actionDictionary.getDictionary()), null, 2)}`;
}

export function getStatesMap(props: {
	stateDictionary: BasicStateDictionary;
}) {
	return `const statesMap = ${JSON.stringify(getObjectKeysMap(props.stateDictionary.getDictionary()), null, 2)}`;
}

export const getSerializedSetByPassed = (props: {
	byPassedList: number[];
}) => {
	return `const byPassedStates = new Set([${props.byPassedList.join(',')}])`;
};

export function getActionToStateFromState(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
	dictionariesSerializer: typeof dictionariesSerializer;
}) {
	return `const actionToStateFromStateDict = {${props.dictionariesSerializer.getActionToStateFromStateDict({
		diagram: props.diagram,
		stateDictionary: props.stateDictionary,
		actionDictionary: props.actionDictionary,
	}).join('\n\t')}}`;
}

export function getAutomataEpochCounterCode() {
	const lines: string[] = [];
	lines.push(`const epoch = { val: 1 };`);
	lines.push(`const incrementEpoch = () => { epoch.val++ };`);
	lines.push(`const getEpoch = () => epoch.val;`);
	return lines.join('\n');
}

export function getAutomataInternalsRegisterCode(props: {
	className: string;
}) {
	const { className } = props;
	const lines: string[] = [];
	lines.push(`const internals = {`);
	lines.push(`\t...internalFunctions,`);
	lines.push(`\t"currentStateId": internalFunctions.currentStateId(${className}),`);
	lines.push(`\t"currentStateName": internalFunctions.currentStateName(${className}, statesDictionary),`);
	lines.push(`\t"currentActionId": internalFunctions.currentActionId(${className}),`);
	lines.push(`\t"currentActionName": internalFunctions.currentActionName(${className}, actionsDictionary),`);
	lines.push(`\t"currentCycle": internalFunctions.currentCycle(${className}),`);
	lines.push(`\t"currentEpoch": getEpoch,`);
	lines.push(`}`);
	return lines.join('\n');
}

export function getFunctionDictionaryInternalRegisterCode() {
	return `functionDictionary.register(internals);`;
}

export function getFunctionDictionaryBuiltInRegisterCode() {
	return `functionDictionary.register(builtInFunctions);`;
}

export const dictionariesSerializer = {
	getActionToStateDictCode: getActionToStateDict,
	getActionToStateFromStateDict,
	getActionToStateFromState,
	getDictionariesCode,
	getActionsMap,
	getStatesMap,
	getSerializedSetByPassed,
	getAutomataInternalsRegisterCode,
	getAutomataEpochCounterCode,
	getFunctionDictionaryInternalRegisterCode,
	getFunctionDictionaryBuiltInRegisterCode,
} as const;
