import { expressionTypes } from './expressions';
import { TConstRef, TCtx, TCtxRef, TDataObj, TDoc, TEmit, TKey, TPayRef, TRawKey, TStmt, TSubscribe } from './types';

export function expectStatementCount(doc: { statements: unknown[] }, count: number): void {
	if (doc.statements.length !== count) {
		throw new Error(`Expected ${count} statements, got ${doc.statements.length}`);
	}
}

function makeDoc(statements: TStmt[] = []): TDoc {
	return { $type: 'Document', statements };
}

function makeRawKey(identifier: string): TRawKey {
	return { $type: 'RawKeyItem', identifier };
}

function makeContextStatement(items: TRawKey[], reducer: TKey[] = []): TCtx {
	return {
		$type: 'ContextStatement',
		items,
		reducer,
	};
}

function makeDataObject(reference: TCtxRef | TPayRef | TConstRef): TDataObj {
	return { $type: expressionTypes.dataObject, reference };
}

function makeContextRef(identifier: string): TCtxRef {
	return { $type: expressionTypes.contextReference, identifier };
}

function makePayloadRef(identifier: string): TPayRef {
	return { $type: expressionTypes.payloadReference, identifier };
}

export const baseEmpty = makeDoc([]);

export const baseContext = makeDoc([
	makeContextStatement(
		[makeRawKey('LeftSideProperty')],
		[makeDataObject(makeContextRef('RightSideProperty'))],
	),
]);

export const baseContextWithPrevious = makeDoc([
	makeContextStatement(
		[makeRawKey('LeftSideProperty')],
		[makeDataObject(makePayloadRef('RightSideProperty'))],
	),
]);

export function createSubscribeStatement(
	eventName = 'event',
	actionName = 'action',
	payloadItems: TKey[] = [makeDataObject(makeContextRef('m'))],
	metaItems: TKey[] = [makeDataObject(makeContextRef('k'))],
): TDoc {
	const subscribe: TSubscribe = {
		$type: 'SubscribeStatement',
		identifier: eventName,
		actionName,
		payload: payloadItems,
		metaItems,
	};

	return makeDoc([subscribe]);
}

export function createEmitStatement(
	eventName = 'event',
	payloadItems: TKey[] = [makeDataObject(makeContextRef('t'))],
	contextItems: TRawKey[] = [makeRawKey('ab')],
): TDoc {
	const emit: TEmit = {
		$type: 'EmitStatement',
		identifier: eventName,
		meta: payloadItems,
		context: contextItems,
	};

	return makeDoc([emit]);
}

export const baseSubscribe = createSubscribeStatement();
export const baseEmitEvent = createEmitStatement();
