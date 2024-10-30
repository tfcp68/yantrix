import { BasicActionDictionary, BasicEventDictionary, BasicStateDictionary } from '@yantrix/automata';
import { TEventSubscribe } from '@yantrix/yantrix-parser';
import { TExpressionRecord, TStateDiagramMatrixIncludeNotes, TStateIncludingNotes } from '../../../../../types/common';
import { getEventEmitterHandler, getEventListenerHandler } from './functions';

export function stateToEventEmitter(state: TStateIncludingNotes, props: {
	stateDictionary: BasicStateDictionary;
	eventDictionary: BasicEventDictionary;
	expressions: TExpressionRecord;
}) {
	const { stateDictionary, eventDictionary, expressions } = props;
	const stateId = stateDictionary.getStateValues({ keys: [state.id] })[0];
	const emittedEvents = state.notes?.emit;
	if (emittedEvents && emittedEvents.length > 0) {
		return `eventAdapter.addEventEmitter(
				${stateId}, 
				${getEventEmitterHandler({ events: emittedEvents, eventDictionary, expressions })}
			);`;
	} else {
		return '';
	}
}

export function stateToEventListeners(state: TStateIncludingNotes, props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	actionDictionary: BasicActionDictionary;
	eventDictionary: BasicEventDictionary;
	expressions: TExpressionRecord;
}) {
	return state.notes?.subscribe?.map(event => eventToEventListener(event, props)) ?? '';
}

export function stateToEventBusSubscribes(state: TStateIncludingNotes, props: {
	eventDictionary: BasicEventDictionary;
}) {
	return state.notes?.subscribe?.map(event => eventToEventBusSubscribe(event, props)) ?? '';
}

function eventToEventListener(event: TEventSubscribe, props: {
	actionDictionary: BasicActionDictionary;
	eventDictionary: BasicEventDictionary;
	expressions: TExpressionRecord;
}) {
	const { eventDictionary, actionDictionary, expressions } = props;
	const eventId = eventDictionary.getEventValues({ keys: [event.identifier] })[0];
	const actionId = actionDictionary.getActionValues({ keys: [event.actionName] })[0];
	return `eventAdapter.addEventListener(
        ${eventId}, 
        ${getEventListenerHandler({ event, actionId, expressions })}
    )`;
}

function eventToEventBusSubscribe(event: TEventSubscribe, props: {
	eventDictionary: BasicEventDictionary;
}) {
	const { eventDictionary } = props;
	const eventId = eventDictionary.getEventValues({ keys: [event.identifier] })[0];
	return `EventBus.subscribe(${eventId}, ({ event, meta }) => {
        const newActions = this.eventAdapter?.handleEvent({ event, meta }) ?? [];
        for(const action of newActions) {
            this.dispatch(action);
        }
        return {
            event,
            meta,
            task_id: 'event_id${eventId}',
            result: EventBus.getEventStack()
        }
    })`;
}
