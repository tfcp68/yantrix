import {
	EmitStatement,
	getEmitStatements,
	getSubscribeStatements,
	SubscribeStatement,
} from '@yantrix/yantrix-parser';
import { TExpressionRecord, TStateDiagramMatrixIncludeNotes, TStateIncludingNotes } from '../../../../../types/common';
import { getActionPayload, getEventCode } from './functions';

export function getEventEmitters(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	expressions: TExpressionRecord;
}) {
	const { diagram } = props;
	return diagram.states.map(state => stateToEventEmitter(state, props)).join('\n');
}

export function getEventListeners(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	expressions: TExpressionRecord;
}) {
	const { diagram } = props;
	return diagram.states.map(state => stateToEventListeners(state, props)).join('\n');
}

export function stateToEventEmitter(state: TStateIncludingNotes, props: {
	expressions: TExpressionRecord;
}) {
	const { expressions } = props;
	if (!state.notes) return '';

	const emittedEvents = getEmitStatements(state.notes);
	if (emittedEvents.length > 0) {
		return `eventAdapter.addEventEmitter(
				statesDictionary["${state.id}"], 
				${getEventEmitterHandler({ events: emittedEvents, expressions })}
			);`;
	} else {
		return '';
	}
}

export function stateToEventListeners(state: TStateIncludingNotes, props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	expressions: TExpressionRecord;
}) {
	if (!state.notes) return '';
	const subscribeStatements = getSubscribeStatements(state.notes);
	return subscribeStatements.map(event => eventToEventListener(event, props)).join(';\n');
}

function eventToEventListener(event: SubscribeStatement, props: {
	expressions: TExpressionRecord;
}) {
	const { expressions } = props;
	return `eventAdapter.addEventListener(
        eventDictionary["${event.identifier}"], 
        ${getEventListenerHandler({ event, expressions })}
    )`;
}

function getEventEmitterHandler(props: {
	events: EmitStatement[];
	expressions: TExpressionRecord;
}) {
	const { events, expressions } = props;
	return `({ state, context }) => {
		const eventsToEmit = [
			${events.map(e => getEventCode(e, expressions)).join(',\n')}
		];
		
		return eventsToEmit[0];
	}`;
}

function getEventListenerHandler(props: {
	event: SubscribeStatement;
	expressions: TExpressionRecord;
}) {
	const { event, expressions } = props;
	return `({ event, meta }) => {

		return {
			action: actionsDictionary["${event.actionName}"],
			payload: {
				${getActionPayload({ event, expressions })}
			}
		}
	}`;
}
