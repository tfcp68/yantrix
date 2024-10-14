import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import { ExpressionTypes, TRefereneceType } from '@yantrix/yantrix-parser';

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
export const pathRecord: Record<TRefereneceType, string> = {
	[ExpressionTypes.Constant]: 'constant',
	[ExpressionTypes.Context]: 'prevContext',
	[ExpressionTypes.Payload]: 'payload',
};
