import { BasicActionDictionary, BasicEventDictionary, BasicStateDictionary } from '@yantrix/automata';
import { TExpressionRecord, TStateDiagramMatrixIncludeNotes } from '../../../../../types/common';
import { stateToEventBusSubscribes, stateToEventEmitter, stateToEventListeners } from './core';

function getEventAdapterCode(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
	eventDictionary: BasicEventDictionary;
	expressions: TExpressionRecord;
}) {
	const lines: string[] = [];
	lines.push('const eventAdapter = new AutomataEventAdapter();');
	lines.push(getEventEmittersCode(props));
	lines.push(getEventListenersCode(props));
	return lines.join('\n');
}

function getEventEmittersCode(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	stateDictionary: BasicStateDictionary;
	eventDictionary: BasicEventDictionary;
	expressions: TExpressionRecord;
}) {
	const { diagram } = props;
	return diagram.states.map(state => stateToEventEmitter(state, props)).join('\n');
}

function getEventListenersCode(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	actionDictionary: BasicActionDictionary;
	eventDictionary: BasicEventDictionary;
	expressions: TExpressionRecord;
}) {
	const { diagram } = props;
	return diagram.states.map(state => stateToEventListeners(state, props)).join('\n');
}

function getEventBusSubscribesCode(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	eventDictionary: BasicEventDictionary;
}) {
	const { diagram } = props;
	return diagram.states.map(state => stateToEventBusSubscribes(state, props)).join('\n');
}

export const eventsSerializer = {
	getEventAdapterCode,
	getEventEmittersCode,
	getEventListenersCode,
	getEventBusSubscribesCode,
};
