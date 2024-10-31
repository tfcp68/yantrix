import { BasicActionDictionary, BasicEventDictionary, BasicStateDictionary } from '@yantrix/automata';
import { TEventEmit, TEventSubscribe } from '@yantrix/yantrix-parser';
import { TExpressionRecord, TStateDiagramMatrixIncludeNotes, TStateIncludingNotes } from '../../../../../types/common';
import { getActionPayload, getEventCode } from './functions';

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

function getEventEmitterHandler(props: {
	events: TEventEmit[];
	eventDictionary: BasicEventDictionary;
	expressions: TExpressionRecord;
}) {
	const { events, eventDictionary, expressions } = props;
	return `({ state, context }) => {
		const eventsToEmit = [
			${events.map(e => getEventCode(e, eventDictionary, expressions)).join(',\n')}
		];
		
		EventBus.dispatch(...eventsToEmit);

		return eventsToEmit[0];
	}`;
}

function getEventListenerHandler(props: {
	event: TEventSubscribe;
	actionId: number | null | undefined;
	expressions: TExpressionRecord;
}) {
	const { event, actionId, expressions } = props;
	return `({ event, meta }) => {

		return {
			action: ${actionId},
			payload: {
				${getActionPayload({ event, expressions })}
			}
		}
	}`;
}
