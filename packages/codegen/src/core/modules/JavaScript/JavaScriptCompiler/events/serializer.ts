import { BasicActionDictionary, BasicEventDictionary, BasicStateDictionary } from '@yantrix/automata';
import { TExpressionRecord, TStateDiagramMatrixIncludeNotes } from '../../../../../types/common';
import { getEventEmittersModel, getEventListenersModel } from './core';

function getEventAdapterModel(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
	eventDictionary: BasicEventDictionary;
	expressions: TExpressionRecord;
}) {
	return {
		emitters: getEventEmittersModel(props),
		listeners: getEventListenersModel(props),
	};
}

function getCreateEventBusModel() {
	return {
		resultVarName: 'nextEventsToProcess',
	};
}

export const eventsSerializer = {
	getEventAdapterModel,
	getCreateEventBusModel,
};
