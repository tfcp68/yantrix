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
import { pathRecord } from '../../../../shared';
import { context } from '../context';
import { TReducerBoundValueVM } from '../context/serializer';

export type TEventCodeVM = {
	eventIdentifier: string;
	metaEntries: TReducerBoundValueVM[];
};

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

export function getEventCodeModel(e: EmitStatement, expressions: TExpressionRecord): TEventCodeVM {
	return {
		eventIdentifier: e.identifier,
		metaEntries: getEventMetaModel({ event: e, expressions }),
	};
}

export function getEventMetaModel(props: {
	event: EmitStatement;
	expressions: TExpressionRecord;
}): TReducerBoundValueVM[] {
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

		return context.serializer.getBoundValuesModel({
			expressions,
			arr: context.serializer.mapReducerItemsModel({
				reducer: contextAsKeyItems as unknown as KeyItem[],
				sourcePath: pathRecord.context,
				expressions,
			}),
			context: keyItemsToRawKeyItems(event.meta),
		});
	} else if (emitHasMeta(event)) {
		return context.serializer.getBoundValuesModel({
			expressions,
			arr: context.serializer.mapReducerItemsModel({ reducer: event.meta, sourcePath: pathRecord.context, expressions }),
			context: keyItemsToRawKeyItems(event.meta),
		});
	} else {
		return [];
	}
}

export function getActionPayloadModel(props: {
	event: SubscribeStatement;
	expressions: TExpressionRecord;
}): TReducerBoundValueVM[] {
	const { event, expressions } = props;

	if (subscribeHasMeta(event)) {
		const targetIdentifiers = subscribeHasPayload(event)
			? keyItemsToRawKeyItems(event.payload)
			: keyItemsToRawKeyItems(event.metaItems);

		return context.serializer.getBoundValuesModel({
			expressions,
			arr: context.serializer.mapReducerItemsModel({
				reducer: event.metaItems,
				sourcePath: pathRecord.payload,
				expressions,
			}),
			context: targetIdentifiers,
		});
	} else if (subscribeHasPayload(event)) {
		return context.serializer.getBoundValuesModel({
			expressions,
			arr: context.serializer.mapReducerItemsModel({
				reducer: event.payload,
				sourcePath: pathRecord.payload,
				expressions,
			}),
			context: keyItemsToRawKeyItems(event.payload),
		});
	} else {
		return [];
	}
}
