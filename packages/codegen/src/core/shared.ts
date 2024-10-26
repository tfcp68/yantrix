import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import { ExpressionTypes, TRefereneceType } from '@yantrix/yantrix-parser';

import { ByPassAction } from '../constants.js';
import { TStateDiagramMatrixIncludeNotes } from '../types/common.js';

export function fillDictionaries(diagram: TStateDiagramMatrixIncludeNotes, stateDictionary: BasicStateDictionary, actionDictionary: BasicActionDictionary): void {
	const stateKeys = diagram.states.map(s => s.id);
	stateDictionary.addStates({ keys: stateKeys });

	for (const state of diagram.states) {
		for (const path of state.actionsPath.map(p => p.action)) {
			// for (const action of path) {
			// 	const test = actionDictionary.getActionValues({ keys: [action] });
			// 	const isUniqueAction = actionDictionary.getActionValues({ keys: [action] })[0] === null;
			// 	if (!isUniqueAction) {
			// 		continue;
			// 	}
			// 	actionDictionary.addActions({ keys: [action] });
			// }
			const firstAction = path[0]!;
			const isUniqueAction = actionDictionary.getActionValues({ keys: [firstAction] })[0] === null;
			if (!isUniqueAction) {
				continue;
			}
			actionDictionary.addActions({ keys: [firstAction] });
		}
	}
}

/**
 * @description
 * Finds all states with "byPass" note and returns array of their IDs.
 * "byPass" note should have one transition to the next state.
 * If there are more than one transition then error is thrown.
 * If there is no transition then error is thrown.
 * If state is not found in the dictionary then error is thrown.
 * @param {TStateDiagramMatrixIncludeNotes} diagram
 * @param {BasicStateDictionary} stateDictionary
 * @returns {number[]}
 */
export function getStatesByPass(diagram: TStateDiagramMatrixIncludeNotes, stateDictionary: BasicStateDictionary) {
	const byPassed: number[] = [];

	diagram.states.forEach((state) => {
		if (state.notes?.byPass) {
			const actionChains = diagram.actionChains[state.id];

			if (!actionChains) throw new Error(`ByPassed state ${state.id} doesn\'t have transition`);
			const byPassAction = actionChains[ByPassAction];

			if (!byPassAction) {
				throw new Error(`ByPass action ${ByPassAction} not found for state ${state.id}`);
			}

			byPassAction.forEach(({ chain }) => {
				if (byPassAction.length > 1 && chain.length === 0) {
					throw new Error(`ByPass action ${ByPassAction} should have more than one transition`);
				}
			});

			const value = stateDictionary.getStateValues({ keys: [state.id] })[0];
			if (!value) throw new Error(`State ${state.id} not found`);

			byPassed.push(value);
		}
	});

	return byPassed;
}

export const pathRecord: Record<TRefereneceType, string> = {
	[ExpressionTypes.Constant]: 'constant',
	[ExpressionTypes.Context]: 'prevContext',
	[ExpressionTypes.Payload]: 'payload',
};
