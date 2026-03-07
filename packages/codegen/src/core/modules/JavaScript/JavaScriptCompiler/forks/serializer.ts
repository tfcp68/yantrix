import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import { TExpressionRecord, TStateDiagramMatrixIncludeNotes } from '../../../../../types/common';
import { getPredicates } from './core';

export type TPredicatesModel = Record<number, Record<number, string>>;

function getPredicatesCode(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
	expressions: TExpressionRecord;
}): TPredicatesModel {
	return getPredicates(props);
}

export const serializer = {
	getPredicatesCode,
};
