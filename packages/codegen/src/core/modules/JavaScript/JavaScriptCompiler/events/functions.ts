import { ExpressionTypes, isEmitFull, isEmitWithMeta, isSubscribeWithMeta, isSubscribeWithPayload, TEventEmit, TEventSubscribe } from '@yantrix/yantrix-parser';
import { TExpressionRecord } from '../../../../../types/common';
import { context } from '../context';

export function getEventCode(e: TEventEmit, expressions: TExpressionRecord) {
	if (isEmitFull(e)) {
		e.context = e.context.map(c => ({
			keyItem: {
				...c.keyItem,
				expressionType: ExpressionTypes.Context,
			},
		}));
	}
	return `{
			event: eventDictionary["${e.identifier}"],
			meta: {
				${getEventMeta({ event: e, expressions })}
			}
		}`;
}

export function getEventMeta(props: {
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

export function getActionPayload(props: {
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
