import {
	EmitStatement,
	getEmitStatements,
	getSubscribeStatements,
	SubscribeStatement,
} from '@yantrix/yantrix-parser';
import { TExpressionRecord, TStateDiagramMatrixIncludeNotes, TStateIncludingNotes } from '../../../../../types/common';
import { TReducerBoundValueVM } from '../context/serializer';
import { getActionPayloadModel, getEventCodeModel, TEventCodeVM } from './functions';

export type TEventEmitterVM = {
	stateId: string;
	events: TEventCodeVM[];
};

export type TEventListenerVM = {
	eventIdentifier: string;
	actionName: string;
	payloadEntries: TReducerBoundValueVM[];
};

export function getEventEmittersModel(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	expressions: TExpressionRecord;
}): TEventEmitterVM[] {
	return props.diagram.states
		.map(state => stateToEventEmitterModel(state, props))
		.filter((entry): entry is TEventEmitterVM => entry !== null);
}

export function getEventListenersModel(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	expressions: TExpressionRecord;
}): TEventListenerVM[] {
	return props.diagram.states.flatMap(state => stateToEventListenersModel(state, props));
}

export function stateToEventEmitterModel(state: TStateIncludingNotes, props: {
	expressions: TExpressionRecord;
}): TEventEmitterVM | null {
	const { expressions } = props;
	if (!state.notes) return null;

	const emittedEvents = getEmitStatements(state.notes);
	if (emittedEvents.length > 0) {
		return {
			stateId: state.id,
			events: getEventEmitterEventsModel({ events: emittedEvents, expressions }),
		};
	} else {
		return null;
	}
}

export function stateToEventListenersModel(state: TStateIncludingNotes, props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	expressions: TExpressionRecord;
}): TEventListenerVM[] {
	if (!state.notes) return [];
	const subscribeStatements = getSubscribeStatements(state.notes);
	return subscribeStatements.map(event => eventToEventListenerModel(event, props));
}

function eventToEventListenerModel(event: SubscribeStatement, props: {
	expressions: TExpressionRecord;
}): TEventListenerVM {
	const { expressions } = props;
	return {
		eventIdentifier: event.identifier,
		actionName: event.actionName,
		payloadEntries: getActionPayloadModel({ event, expressions }),
	};
}

function getEventEmitterEventsModel(props: {
	events: EmitStatement[];
	expressions: TExpressionRecord;
}): TEventCodeVM[] {
	const { events, expressions } = props;
	return events.map(e => getEventCodeModel(e, expressions));
}
