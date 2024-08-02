import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import { TExpressionRecord, TStateDiagramMatrixIncludeNotes } from '../types/common.js';
import {
	ExpressionTypes,
	isKeyItemReference,
	isKeyItemWithExpression,
	TExpressionFunction,
	TKeyItemReducerOrExpression,
	TRefereneceType,
} from '@yantrix/yantrix-parser';

export const fillDictionaries = (
	diagram: TStateDiagramMatrixIncludeNotes,
	stateDictionary: BasicStateDictionary,
	actionDictionary: BasicActionDictionary,
) => {
	const stateKeys = diagram.states.map((s) => s.id);
	stateDictionary.addStates({ keys: stateKeys });

	for (const state of diagram.states) {
		for (const path of state.actionsPath.map((p) => p.action)) {
			const fullPath = path.join('');
			const isUniqueAction = actionDictionary.getActionValues({ keys: [fullPath] })[0] === null;

			if (!isUniqueAction) {
				continue;
			}
			actionDictionary.addActions({ keys: [path.join(' ')] });
		}
	}
};
export const pathRecord: Record<TRefereneceType, string> = {
	[ExpressionTypes.Constant]: 'constant',
	[ExpressionTypes.Context]: 'prevContext',
	[ExpressionTypes.Payload]: 'payload',
};
