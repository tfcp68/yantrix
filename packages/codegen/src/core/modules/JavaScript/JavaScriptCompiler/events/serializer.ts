import { BasicActionDictionary, BasicEventDictionary, BasicStateDictionary } from '@yantrix/automata';
import { TExpressionRecord, TStateDiagramMatrixIncludeNotes } from '../../../../../types/common';
import { getEventEmitters, getEventListeners } from './core';

function getEventAdapterModel(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
	eventDictionary: BasicEventDictionary;
	expressions: TExpressionRecord;
}) {
	return {
		emittersCode: getEventEmitters(props),
		listenersCode: getEventListeners(props),
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
