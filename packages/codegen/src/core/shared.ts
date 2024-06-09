import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import { TExpressionRecord, TStateDiagramMatrixIncludeNotes } from '../types/common.js';
import { ExpressionTypes } from '@yantrix/yantrix-parser';
import { property } from 'lodash-es';

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

export const Expressions: TExpressionRecord = {
	[ExpressionTypes.ArrayDeclaration]: () => '[]',
	[ExpressionTypes.Function]: (value) => {
		throw new Error(`Not implemented ${ExpressionTypes.Function}`);
	},
	[ExpressionTypes.Property]: ({ Property }) => {
		return `${property}`;
	},

	[ExpressionTypes.NumberDeclaration]: ({ NumberDeclaration }) => {
		return `${NumberDeclaration}`;
	},

	[ExpressionTypes.StringDeclaration]: ({ StringDeclaration }) => {
		return `${StringDeclaration}`;
	},
} as const;
