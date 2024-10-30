import { BasicActionDictionary, BasicEventDictionary, BasicStateDictionary } from '@yantrix/automata';
import { TExpressionRecord, TStateDiagramMatrixIncludeNotes } from '../../../../../types/common';
import { getEventBusSubscribeCode, getEventEmitterHandlerCode, getEventListenerCode } from './functions';

function getEventAdapterCode(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
	eventDictionary: BasicEventDictionary;
	expressions: TExpressionRecord;
}) {
	const lines: string[] = [];
	lines.push('const eventAdapter = new AutomataEventAdapter()');
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
	const { diagram, stateDictionary, eventDictionary, expressions } = props;
	return diagram.states.map((state) => {
		const stateId = stateDictionary.getStateValues({ keys: [state.id] })[0];
		const emittedEvents = state.notes?.emit;
		if (emittedEvents && emittedEvents.length > 0) {
			return `
                eventAdapter.addEventEmitter(
                    ${stateId}, 
                    ${getEventEmitterHandlerCode({ events: emittedEvents, eventDictionary, expressions })}
                );
            `;
		} else {
			return '';
		}
	}).join('\n');
}

function getEventListenersCode(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	actionDictionary: BasicActionDictionary;
	eventDictionary: BasicEventDictionary;
	expressions: TExpressionRecord;
}) {
	const { diagram, actionDictionary, eventDictionary, expressions } = props;
	return diagram.states.map((state) => {
		return state.notes?.subscribe?.map((event) => {
			const eventId = eventDictionary.getEventValues({ keys: [event.identifier] })[0];
			const actionId = actionDictionary.getActionValues({ keys: [event.actionName] })[0];
			return getEventListenerCode({ event, eventId, actionId, expressions });
		}) ?? '';
	}).join('\n');
}

function getEventBusSubscribesCode(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	eventDictionary: BasicEventDictionary;
}) {
	const { diagram, eventDictionary } = props;
	return diagram.states.map((state) => {
		return state.notes?.subscribe?.map((event) => {
			const eventId = eventDictionary.getEventValues({ keys: [event.identifier] })[0];
			return getEventBusSubscribeCode({ eventId });
		}) ?? '';
	}).join('\n');
}

export const eventsSerializer = {
	getEventAdapterCode,
	getEventEmittersCode,
	getEventListenersCode,
	getEventBusSubscribesCode,
};
