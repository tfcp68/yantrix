import {
	ArrayLiteral,
	Constant,
	ContextReference,
	ContextStatement,
	DataObject,
	Document,
	Expression,
	FunctionCall,
	NumberLiteral,
	PayloadReference,
	RawKeyItem,
	StringLiteral,
} from '../../src';

function createDocument(): Document {
	const doc = { $type: 'Document', statements: [] };
	return doc as unknown as Document;
}

function createContextStatement(doc: Document): Omit<ContextStatement, '$container'> {
	const ctx: any = {
		$type: 'ContextStatement',
		items: [],
		reducer: [],
	};
	doc.statements.push(ctx);
	return ctx as Omit<ContextStatement, '$container'>;
}

export function createRawKeyItem(identifier: string, parent: { items: any[] }): RawKeyItem {
	const item = {
		$type: 'RawKeyItem',
		identifier,
	} as const;
	parent.items.push(item);
	return item as unknown as RawKeyItem;
}

function createContextStatementWithSingleItem(
	itemBuilder: (ctx: ContextStatement, doc: Document) => void,
): Document {
	const doc = createDocument();
	const ctx = createContextStatement(doc) as unknown as ContextStatement;
	itemBuilder(ctx, doc);
	return doc;
}

function createStringLiteral(valueWithQuotes: string): StringLiteral {
	return { $type: 'StringLiteral', value: valueWithQuotes } as unknown as StringLiteral;
}

function createNumberLiteral(value: number): NumberLiteral {
	return { $type: 'NumberLiteral', value: String(value) } as unknown as NumberLiteral;
}

function createArrayLiteral(): ArrayLiteral {
	return { $type: 'ArrayLiteral' } as unknown as ArrayLiteral;
}

function createFunctionCall(name: string): FunctionCall {
	return { $type: 'FunctionCall', name, args: [] } as unknown as FunctionCall;
}

function createContextRef(identifier: string): ContextReference {
	return { $type: 'ContextReference', identifier } as unknown as ContextReference;
}

function createPayloadRef(identifier: string): PayloadReference {
	return { $type: 'PayloadReference', identifier } as unknown as PayloadReference;
}

function createConstant(identifier: string): Constant {
	return { $type: 'Constant', identifier } as unknown as Constant;
}

function createDataObject(reference: Constant | ContextReference | PayloadReference): DataObject {
	return { $type: 'DataObject', reference } as unknown as DataObject;
}

export const keyItem = {
	declarationKeyItem: (propertyName: string) =>
		createContextStatementWithSingleItem((ctx) => {
			createRawKeyItem(propertyName, ctx);
		}),

	withStringInitial: (propertyName: string, stringWithQuotes: string) =>
		createContextStatementWithSingleItem((ctx) => {
			const item = createRawKeyItem(propertyName, ctx);
			item.defaultValue = createStringLiteral(stringWithQuotes) as unknown as Expression;
		}),

	withArrayInitial: (propertyName: string) =>
		createContextStatementWithSingleItem((ctx) => {
			const item = createRawKeyItem(propertyName, ctx);
			item.defaultValue = createArrayLiteral() as unknown as Expression;
		}),

	withIntegerInitial: (propertyName: string, integerValue: number) =>
		createContextStatementWithSingleItem((ctx) => {
			const item = createRawKeyItem(propertyName, ctx);
			item.defaultValue = createNumberLiteral(integerValue) as unknown as Expression;
		}),

	withDecimalInitial: (propertyName: string, decimalValue: number) =>
		createContextStatementWithSingleItem((ctx) => {
			const item = createRawKeyItem(propertyName, ctx);
			item.defaultValue = createNumberLiteral(decimalValue) as unknown as Expression;
		}),

	withContextInitial: (propertyName: string, ref: string) =>
		createContextStatementWithSingleItem((ctx) => {
			const item = createRawKeyItem(propertyName, ctx);
			item.defaultValue = createDataObject(createContextRef(ref)) as unknown as Expression;
		}),

	withPayloadInitial: (propertyName: string, ref: string) =>
		createContextStatementWithSingleItem((ctx) => {
			const item = createRawKeyItem(propertyName, ctx);
			item.defaultValue = createDataObject(createPayloadRef(ref)) as unknown as Expression;
		}),

	withConstantInitial: (propertyName: string, ref: string) =>
		createContextStatementWithSingleItem((ctx) => {
			const item = createRawKeyItem(propertyName, ctx);
			item.defaultValue = createDataObject(createConstant(ref)) as unknown as Expression;
		}),
	withMultipleInitials: (pairs: Array<[string, string | number]>) =>
		createContextStatementWithSingleItem((ctx) => {
			for (const [name, raw] of pairs) {
				const item = createRawKeyItem(name, ctx);

				if (typeof raw === 'string') {
					const unquoted = raw.replace(/^"(.*)"$/, '$1');
					item.defaultValue = createStringLiteral(unquoted) as unknown as Expression;
				} else {
					item.defaultValue = createNumberLiteral(Number(raw)) as unknown as Expression;
				}
			}
		}),
};

export const functionsFixtures = {
	expression: (propertyName: string, functionName: string) =>
		createContextStatementWithSingleItem((ctx) => {
			const item = createRawKeyItem(propertyName, ctx);
			item.defaultValue = createFunctionCall(functionName) as unknown as Expression;
		}),
};
