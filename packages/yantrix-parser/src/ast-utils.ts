import {
	ByPass,
	ContextStatement,
	DataObject,
	DefineExpression,
	DefineFunction,
	DefineStatement,
	Document,
	EmitStatement,
	Expression,
	ExpressionStatement,
	FunctionCall,
	ImmutableValue,
	InitialState,
	InjectStatement,
	isArrayLiteral,
	isByPass,
	isConstant,
	isContextReference,
	isContextStatement,
	isDataObject,
	isDefineFunction,
	isDefineStatement,
	isEmitStatement,
	isExpressionStatement,
	isFunctionCall,
	isInitialState,
	isInjectStatement,
	isNumberLiteral,
	isPayloadReference,
	isStringLiteral,
	isSubscribeStatement,
	KeyItem,
	NumberLiteral,
	Statement,
	StringLiteral,
	SubscribeStatement,
} from './generated/ast.js';

export function getStatementsByType<T extends Statement>(
	doc: Document,
	typeGuard: (node: unknown) => node is T,
): T[] {
	return doc.statements.filter(typeGuard);
}

export function getInitialStates(doc: Document): InitialState[] {
	return getStatementsByType(doc, isInitialState);
}

export function hasInitialState(doc: Document): boolean {
	return doc.statements.some(isInitialState);
}

export function getByPassStatements(doc: Document): ByPass[] {
	return getStatementsByType(doc, isByPass);
}

export function hasByPass(doc: Document): boolean {
	return doc.statements.some(isByPass);
}

export function getContextStatements(doc: Document): ContextStatement[] {
	return getStatementsByType(doc, isContextStatement);
}

export function getEmitStatements(doc: Document): EmitStatement[] {
	return getStatementsByType(doc, isEmitStatement);
}

export function getSubscribeStatements(doc: Document): SubscribeStatement[] {
	return getStatementsByType(doc, isSubscribeStatement);
}

export function getDefineStatements(doc: Document): DefineStatement[] {
	return getStatementsByType(doc, isDefineStatement);
}

export function getInjectStatements(doc: Document): InjectStatement[] {
	return getStatementsByType(doc, isInjectStatement);
}

export function getExpressionStatements(doc: Document): ExpressionStatement[] {
	return getStatementsByType(doc, isExpressionStatement);
}

export type TExpressionType =
	| 'function'
	| 'string'
	| 'array'
	| 'integer'
	| 'decimal'
	| 'constant'
	| 'payload'
	| 'context';

export function getExpressionType(expr: Expression | KeyItem): TExpressionType {
	if (isFunctionCall(expr)) return 'function';
	if (isDataObject(expr)) {
		const ref = expr.reference;
		if (isConstant(ref)) return 'constant';
		if (isPayloadReference(ref)) return 'payload';
		if (isContextReference(ref)) return 'context';
	}
	if (isArrayLiteral(expr)) return 'array';
	if (isStringLiteral(expr)) return 'string';
	if (isNumberLiteral(expr)) {
		return expr.value.includes('.') ? 'decimal' : 'integer';
	}
	throw new Error(`Unknown expression type: ${JSON.stringify(expr)}`);
}

export function isFunctionExpression(expr: Expression | KeyItem): expr is FunctionCall {
	return isFunctionCall(expr);
}

export function isReferenceExpression(expr: Expression | KeyItem): expr is DataObject {
	return isDataObject(expr);
}

export function isImmutableExpression(expr: Expression | KeyItem): expr is ImmutableValue {
	return isArrayLiteral(expr) || isStringLiteral(expr) || isNumberLiteral(expr);
}

export function getStringValue(literal: StringLiteral): string {
	const value = literal.value;
	if ((value.startsWith('\'') && value.endsWith('\''))
		|| (value.startsWith('"') && value.endsWith('"'))) {
		return value.slice(1, -1);
	}
	return value;
}

export function getNumberValue(literal: NumberLiteral): number {
	return Number(literal.value);
}

export function isIntegerLiteral(literal: NumberLiteral): boolean {
	return !literal.value.includes('.');
}

export function isDecimalLiteral(literal: NumberLiteral): boolean {
	return literal.value.includes('.');
}

export function getReferenceIdentifier(expr: DataObject): string {
	return expr.reference.identifier;
}

export function getReferenceType(expr: DataObject): 'constant' | 'payload' | 'context' {
	if (isConstant(expr.reference)) return 'constant';
	if (isPayloadReference(expr.reference)) return 'payload';
	if (isContextReference(expr.reference)) return 'context';
	throw new Error('Unknown reference type');
}

export function getContextKeys(ctx: ContextStatement): string[] {
	return ctx.items.map(item => item.identifier);
}

export function hasReducer(ctx: ContextStatement): boolean {
	return ctx.reducer && ctx.reducer.length > 0;
}

export function emitHasMeta(emit: EmitStatement): boolean {
	return emit.meta && emit.meta.length > 0;
}

export function emitHasContext(emit: EmitStatement): boolean {
	return emit.context && emit.context.length > 0;
}

export function isFullEmit(emit: EmitStatement): boolean {
	return emitHasMeta(emit) && emitHasContext(emit);
}

export function subscribeHasPayload(sub: SubscribeStatement): boolean {
	return sub.payload && sub.payload.length > 0;
}

export function subscribeHasMeta(sub: SubscribeStatement): boolean {
	return sub.metaItems && sub.metaItems.length > 0;
}

export function getDefineArgs(def: DefineStatement): string[] {
	return def.args;
}

export function defineExpressionIsFunction(expr: DefineExpression): expr is DefineFunction {
	return isDefineFunction(expr);
}

export function getFunctionName(func: FunctionCall): string {
	return func.name;
}

export function getFunctionArgs(func: FunctionCall): Expression[] {
	return func.args;
}

export function calcFunctionDepth(expr: Expression | KeyItem, currentDepth: number = 0): number {
	if (!isFunctionCall(expr)) {
		return currentDepth;
	}

	let maxDepth = currentDepth + 1;
	for (const arg of expr.args) {
		const argDepth = calcFunctionDepth(arg, currentDepth + 1);
		maxDepth = Math.max(maxDepth, argDepth);
	}
	return maxDepth;
}

export const MAX_NESTED_FUNC_LEVEL = 8;

export function validateFunctionNesting(expr: Expression | KeyItem): void {
	const depth = calcFunctionDepth(expr);
	if (depth > MAX_NESTED_FUNC_LEVEL) {
		throw new Error(`Nested function limit exceeded: ${depth} > ${MAX_NESTED_FUNC_LEVEL}`);
	}
}
