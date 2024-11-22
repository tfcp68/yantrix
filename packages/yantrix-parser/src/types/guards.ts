import { ExpressionTypes } from '../index';
import { TContextReducer, TEmitFull, TEmitWithMeta, TSubscribeWithMeta, TSubscribeWithPayload } from '../types/statements';
import { TExpression } from './expressions';
import { TKeyItemReducer, TKeyItemWithExpression } from './keyItem';

export function isKeyItemBase(obj: any): obj is TKeyItemReducer {
	return typeof obj === 'object' && Object.keys(obj).includes('expressionType');
}

export function isContextWithReducer(obj: any): obj is TContextReducer {
	return typeof obj === 'object' && Object.keys(obj).includes('context') && Object.keys(obj).includes('reducer');
}

export function isKeyItemReference(obj: any): obj is TKeyItemReducer {
	return (
		typeof obj === 'object'
		&& Object.keys(obj).includes('identifier')
		&& Object.keys(obj).includes('expressionType')
	);
}

export function isKeyItemWithExpression(obj: any): obj is TKeyItemWithExpression {
	return typeof obj === 'object' && Object.keys(obj).includes('expression');
}

export function isFunctionExpression(obj: any): obj is TExpression<'function'> {
	return obj != null
		&& Object.keys(obj).includes('expressionType')
		&& obj.expressionType === ExpressionTypes.Function
		&& obj.FunctionDeclaration != null
		&& typeof obj.FunctionDeclaration === 'object';
}

export function isEmitWithMeta(obj: any): obj is TEmitWithMeta {
	return obj != null
		&& Object.keys(obj).includes('meta')
		&& obj.meta != null;
}

export function isEmitFull(obj: any): obj is TEmitFull {
	return obj != null
		&& Object.keys(obj).includes('meta')
		&& obj.meta != null
		&& Object.keys(obj).includes('context')
		&& obj.context != null;
}

export function isSubscribeWithPayload(obj: any): obj is TSubscribeWithPayload {
	return obj != null
		&& Object.keys(obj).includes('payload')
		&& obj.payload != null;
}

export function isSubscribeWithMeta(obj: any): obj is TSubscribeWithMeta {
	return obj != null
		&& Object.keys(obj).includes('payload')
		&& obj.payload != null
		&& Object.keys(obj).includes('meta')
		&& obj.meta != null;
}
