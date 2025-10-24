import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import { TExpressionRecord, TStateDiagramMatrixIncludeNotes } from '../../../../../types/common';
import { getPredicates } from './core';

async function getPredicatesCode(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
	expressions: TExpressionRecord;
}) {
	const predicateObject = await getPredicates(props);
	const entries = Object.entries(predicateObject);
	if (!entries || entries.length === 0) return '';
	return `const predicates = {
		${Object.entries(predicateObject)
			.map(([stateId, predicates]) => `${stateId}: { ${getStatePredicateCode(predicates)} }`)
			.join(',\n')}
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
