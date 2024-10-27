import { BasicEventDictionary } from '@yantrix/automata';
import { ExpressionTypes, isEmitFull, isEmitWithMeta, isSubscribeWithMeta, isSubscribeWithPayload, TEventEmit, TEventSubscribe } from '@yantrix/yantrix-parser';
import { TExpressionRecord } from '../../../../../types/common';
import { context } from '../context';

export function getEventEmitterHandlerCode(props: {
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

export function getEventListenerCode(props: {
	event: TEventSubscribe;
	eventId: number | null | undefined;
	actionId: number | null | undefined;
	expressions: TExpressionRecord;
}) {
	const { event, eventId, actionId, expressions } = props;
	return `
	eventAdapter.addEventListener(${eventId}, ${getEventListenerHandlerCode({ event, actionId, expressions })})
	`;
}

export function getEventBusSubscribeCode(props: {
	eventId: number | null | undefined;
}) {
	return `EventBus.subscribe(${props.eventId}, ({ event, meta }) => {
		const newActions = this.eventAdapter?.handleEvent({ event, meta }) ?? [];
		for(const action of newActions) {
			this.dispatch(action);
		}
		return {
			event,
			meta,
			task_id: 'event_id${props.eventId}',
			result: EventBus.getEventStack()
		}
	})`;
}

function getEventListenerHandlerCode(props: {
	event: TEventSubscribe;
	actionId: number | null | undefined;
	expressions: TExpressionRecord;
}) {
	const { event, actionId, expressions } = props;
	return `({ event, meta }) => {

		return {
			action: ${actionId},
			payload: {
				${getActionPayloadCode({ event, expressions })}
			}
		}
	}`;
}

function getEventCode(e: TEventEmit, eventDictionary: BasicEventDictionary, expressions: TExpressionRecord) {
	if (isEmitFull(e)) {
		e.context = e.context.map(c => ({
			keyItem: {
				...c.keyItem,
				expressionType: ExpressionTypes.Context,
			},
		}));
	}
	return `
		{
			event: ${eventDictionary.getEventValues({ keys: [e.identifier] })[0]},
			meta: {
				${getEventMetaCode({ event: e, expressions })}
			}
		}
	`;
}

function getEventMetaCode(props: {
	event: TEventEmit;
	expressions: TExpressionRecord;
}): string {
	const { event, expressions } = props;
	if (isEmitFull(event)) {
		return context.serializer.getBoundValues({
			expressions,
			arr: context.serializer.mapReducerItems({ reducer: event.context, sourcePath: 'context', expressions }),
			context: event.meta,
		}).toString();
	} else if (isEmitWithMeta(event)) {
		return context.serializer.getBoundValues({
			expressions,
			arr: context.serializer.mapReducerItems({ reducer: event.meta, sourcePath: 'context', expressions }),
			context: event.meta,
		}).toString();
	} else {
		return '';
	}
}

function getActionPayloadCode(props: {
	event: TEventSubscribe;
	expressions: TExpressionRecord;
}) {
	const { event, expressions } = props;
	if (isSubscribeWithMeta(event)) {
		return context.serializer.getBoundValues({
			expressions,
			arr: context.serializer.mapReducerItems({ reducer: event.meta, sourcePath: 'meta', expressions }),
			context: event.payload,
		}).toString();
	} else if (isSubscribeWithPayload(event)) {
		return context.serializer.getBoundValues({
			expressions,
			arr: context.serializer.mapReducerItems({ reducer: event.payload, sourcePath: 'meta', expressions }),
			context: event.payload,
		}).toString();
	} else {
		return '';
	}
}
