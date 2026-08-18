import {
	getSubscribeStatements,
	isEffectStatement,
	isEmitStatement,
	SubscribeStatement,
} from '@yantrix/yantrix-parser';
import { TExpressionRecord, TStateDiagramMatrixIncludeNotes, TStateIncludingNotes } from '../../../../../types/common';
import { TReducerBoundValueVM } from '../context/serializer';
import { getActionPayloadModel, getEffectEventCodeModel, getEventCodeModel, TEventCodeVM } from './functions';

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

	const emittedEvents = state.notes.statements.flatMap((statement) => {
		if (isEmitStatement(statement)) return [getEventCodeModel(statement, expressions)];
		if (isEffectStatement(statement)) return [getEffectEventCodeModel(statement)];
		return [];
	});
	if (emittedEvents.length > 0) {
		return {
			stateId: state.id,
			events: emittedEvents,
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
