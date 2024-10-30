import { BasicEventDictionary } from '@yantrix/automata';
import { ExpressionTypes, isEmitFull, isEmitWithMeta, isSubscribeWithMeta, isSubscribeWithPayload, TEventEmit, TEventSubscribe } from '@yantrix/yantrix-parser';
import { TExpressionRecord } from '../../../../../types/common';
import { context } from '../context';

export function getEventEmitterHandler(props: {
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

export function getEventListenerHandler(props: {
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

function getEventCode(e: TEventEmit, eventDictionary: BasicEventDictionary, expressions: TExpressionRecord) {
	if (isEmitFull(e)) {
		e.context = e.context.map(c => ({
			keyItem: {
				...c.keyItem,
				expressionType: ExpressionTypes.Context,
			},
		}));
	}
	return `{
			event: ${eventDictionary.getEventValues({ keys: [e.identifier] })[0]},
			meta: {
				${getEventMeta({ event: e, expressions })}
			}
		}`;
}

function getEventMeta(props: {
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

function getActionPayload(props: {
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
