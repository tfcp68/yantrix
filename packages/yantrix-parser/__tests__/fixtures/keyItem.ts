import {
	TArrLit,
	TConstRef,
	TCtx,
	TCtxRef,
	TDataObj,
	TDoc,
	TFuncCall,
	TNumLit,
	TPayRef,
	TRawKey,
	TStringLit,
} from './types';

function createDocument(): TDoc {
	return { $type: 'Document', statements: [] };
}

function createContextStatement(doc: TDoc): TCtx {
	const ctx: TCtx = {
		$type: 'ContextStatement',
		items: [],
		reducer: [],
	};
	doc.statements.push(ctx);
	return ctx;
}

export function createRawKeyItem(identifier: string, parent: { items: TRawKey[] }): TRawKey {
	const item: TRawKey = {
		$type: 'RawKeyItem',
		identifier,
	};
	parent.items.push(item);
	return item;
}

function createContextStatementWithSingleItem(
	itemBuilder: (ctx: TCtx, doc: TDoc) => void,
): TDoc {
	const doc = createDocument();
	const ctx = createContextStatement(doc);
	itemBuilder(ctx, doc);
	return doc;
}

function createStringLiteral(valueWithQuotes: string): TStringLit {
	return { $type: 'StringLiteral', value: valueWithQuotes };
}

function createNumberLiteral(value: number): TNumLit {
	return { $type: 'NumberLiteral', value: String(value) };
}

function createArrayLiteral(): TArrLit {
	return { $type: 'ArrayLiteral' };
}

function createFunctionCall(name: string): TFuncCall {
	return { $type: 'FunctionCall', name, args: [] };
}

function createContextRef(identifier: string): TCtxRef {
	return { $type: 'ContextReference', identifier };
}

function createPayloadRef(identifier: string): TPayRef {
	return { $type: 'PayloadReference', identifier };
}

function createConstant(identifier: string): TConstRef {
	return { $type: 'Constant', identifier };
}

function createDataObject(reference: TConstRef | TCtxRef | TPayRef): TDataObj {
	return { $type: 'DataObject', reference };
}

export const keyItem = {
	declarationKeyItem: (propertyName: string) =>
		createContextStatementWithSingleItem((ctx) => {
			createRawKeyItem(propertyName, ctx);
		}),

	withStringInitial: (propertyName: string, stringWithQuotes: string) =>
		createContextStatementWithSingleItem((ctx) => {
			const item = createRawKeyItem(propertyName, ctx);
			item.defaultValue = createStringLiteral(stringWithQuotes);
		}),

	withArrayInitial: (propertyName: string) =>
		createContextStatementWithSingleItem((ctx) => {
			const item = createRawKeyItem(propertyName, ctx);
			item.defaultValue = createArrayLiteral();
		}),

	withIntegerInitial: (propertyName: string, integerValue: number) =>
		createContextStatementWithSingleItem((ctx) => {
			const item = createRawKeyItem(propertyName, ctx);
			item.defaultValue = createNumberLiteral(integerValue);
		}),

	withDecimalInitial: (propertyName: string, decimalValue: number) =>
		createContextStatementWithSingleItem((ctx) => {
			const item = createRawKeyItem(propertyName, ctx);
			item.defaultValue = createNumberLiteral(decimalValue);
		}),

	withContextInitial: (propertyName: string, ref: string) =>
		createContextStatementWithSingleItem((ctx) => {
			const item = createRawKeyItem(propertyName, ctx);
			item.defaultValue = createDataObject(createContextRef(ref));
		}),

	withPayloadInitial: (propertyName: string, ref: string) =>
		createContextStatementWithSingleItem((ctx) => {
			const item = createRawKeyItem(propertyName, ctx);
			item.defaultValue = createDataObject(createPayloadRef(ref));
		}),

	withConstantInitial: (propertyName: string, ref: string) =>
		createContextStatementWithSingleItem((ctx) => {
			const item = createRawKeyItem(propertyName, ctx);
			item.defaultValue = createDataObject(createConstant(ref));
		}),

	withMultipleInitials: (pairs: Array<[string, string | number]>) =>
		createContextStatementWithSingleItem((ctx) => {
			for (const [name, raw] of pairs) {
				const item = createRawKeyItem(name, ctx);

				if (typeof raw === 'string') {
					const unquoted = raw.replace(/^"(.*)"$/, '$1');
					item.defaultValue = createStringLiteral(unquoted);
				} else {
					item.defaultValue = createNumberLiteral(Number(raw));
				}
			}
		}),
};

export const functionsFixtures = {
	expression: (propertyName: string, functionName: string) =>
		createContextStatementWithSingleItem((ctx) => {
			const item = createRawKeyItem(propertyName, ctx);
			item.defaultValue = createFunctionCall(functionName);
		}),
};
