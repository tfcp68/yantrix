import {
	ArrayLiteral,
	Constant,
	ContextReference,
	ContextStatement,
	DataObject,
	Document,
	EmitStatement,
	Expression,
	FunctionCall,
	KeyItem,
	NumberLiteral,
	PayloadReference,
	RawKeyItem,
	Statement,
	StringLiteral,
	SubscribeStatement,
} from '../../src';

export type TExpression = Omit<Expression, '$container'>;
export type TStringLit = Omit<StringLiteral, '$container'>;
export type TNumLit = Omit<NumberLiteral, '$container'>;
export type TArrLit = Omit<ArrayLiteral, '$container'>;
export type TFuncCall = Omit<FunctionCall, '$container' | 'args'> & { args: TExpression[] };

export type TStmt = Omit<Statement, '$container'>;
export type TDoc = Omit<Document, '$container' | 'statements'> & { statements: TStmt[] };

export type TCtx = Omit<ContextStatement, '$container' | 'items' | 'reducer'> & {
	items: TRawKey[];
	reducer: TKey[];
};
export type TRawKey = Omit<RawKeyItem, '$container' | 'defaultValue'> & {
	defaultValue?: TExpression;
};
export type TKey = Omit<KeyItem, '$container' | 'defaultValue'> & {
	defaultValue?: TExpression;
};

export type TDataObj = Omit<DataObject, '$container' | 'reference'> & {
	reference: TCtxRef | TPayRef | TConstRef;
};
export type TCtxRef = Omit<ContextReference, '$container'>;
export type TPayRef = Omit<PayloadReference, '$container'>;
export type TConstRef = Omit<Constant, '$container'>;

export type TSubscribe = Omit<SubscribeStatement, '$container' | 'payload' | 'metaItems'> & {
	payload: TKey[];
	metaItems: TKey[];
};
export type TEmit = Omit<EmitStatement, '$container' | 'meta' | 'context'> & {
	meta: TKey[];
	context: TRawKey[];
};
