import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import { getActionToStateFromStateModel } from '../../../../transitions.js';
import { getObjectKeysMap } from './core';
import { TDictionaries } from './types';

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
