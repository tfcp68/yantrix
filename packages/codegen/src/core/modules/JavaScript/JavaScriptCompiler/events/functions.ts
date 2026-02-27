import {
	emitHasMeta,
	EmitStatement,
	getReferenceIdentifier,
	isDataObject,
	isFullEmit,
	KeyItem,
	RawKeyItem,
	subscribeHasMeta,
	subscribeHasPayload,
	SubscribeStatement,
} from '@yantrix/yantrix-parser';
import { TExpressionRecord } from '../../../../../types/common';
import { context } from '../context';

function getKeyItemIdentifier(item: KeyItem): string {
	if (isDataObject(item)) {
		return getReferenceIdentifier(item);
	}
	return `_item`;
}

function keyItemsToRawKeyItems(items: KeyItem[]): RawKeyItem[] {
	return items.map(item => ({
		identifier: getKeyItemIdentifier(item),
		defaultValue: undefined,
	})) as unknown as RawKeyItem[];
}

export function getEventCode(e: EmitStatement, expressions: TExpressionRecord) {
	return `{
			event: eventDictionary["${e.identifier}"],
			meta: {
				${getEventMeta({ event: e, expressions })}
			}
		}`;
}

export function getEventMeta(props: {
	event: EmitStatement;
	expressions: TExpressionRecord;
}): string {
	const { event, expressions } = props;
	if (isFullEmit(event)) {
		const contextAsKeyItems = event.context.map((rawKeyItem) => {
			return {
				$type: 'DataObject' as const,
				reference: {
					$type: 'ContextReference' as const,
					identifier: rawKeyItem.identifier,
				},
				assignedExpression: rawKeyItem.defaultValue,
			};
		});
		return context.serializer.getBoundValues({
			expressions,
			arr: context.serializer.mapReducerItems({ reducer: contextAsKeyItems as any, sourcePath: 'context', expressions }),
			context: keyItemsToRawKeyItems(event.meta),
		}).toString();
	} else if (emitHasMeta(event)) {
		return context.serializer.getBoundValues({
			expressions,
			arr: context.serializer.mapReducerItems({ reducer: event.meta, sourcePath: 'context', expressions }),
			context: keyItemsToRawKeyItems(event.meta),
		}).toString();
	} else {
		return '';
	}
}

export function getActionPayload(props: {
	event: SubscribeStatement;
	expressions: TExpressionRecord;
}) {
	const { event, expressions } = props;
	if (subscribeHasMeta(event)) {
		const targetIdentifiers = subscribeHasPayload(event)
			? keyItemsToRawKeyItems(event.payload)
			: keyItemsToRawKeyItems(event.metaItems);

		return context.serializer.getBoundValues({
			expressions,
			arr: context.serializer.mapReducerItems({ reducer: event.metaItems, sourcePath: 'meta', expressions }),
			context: targetIdentifiers,
		}).toString();
	} else if (subscribeHasPayload(event)) {
		return context.serializer.getBoundValues({
			expressions,
			arr: context.serializer.mapReducerItems({ reducer: event.payload, sourcePath: 'meta', expressions }),
			context: keyItemsToRawKeyItems(event.payload),
		}).toString();
	} else {
		return '';
	}
}
