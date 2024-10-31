import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import { TExpressionRecord, TStateDiagramMatrixIncludeNotes } from '../../../../../types/common';
import { getPredicates } from './core';

function getPredicatesCode(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
	expressionRecord: TExpressionRecord;
}) {
	const lines: string[] = [];
	Object.entries(getPredicates(props)).forEach(([stateId, predicates]) => {
		lines.push(`${stateId}: {
			${getStatePredicateCode(predicates)}
		}`);
	});
	return `const predicates = {
		${lines.join(',\n')}
	}`;
}

function getStatePredicateCode(predicates: {
	[k: string]: string;
}) {
	return Object.entries(predicates).map(([actionId, predicate]) => `${actionId}: ${predicate}`).join(',\n');
}

export const serializer = {
	getPredicatesCode,
};
