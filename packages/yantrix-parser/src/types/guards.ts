import { ExpressionTypes, TMapped, TMappedKeys } from './expressions.js';
import { TKeyItemBase, TKeyItems, TKeyItemWithExpression } from './keyItem.js';
import { TAction, TPayloadToContext, TPreviousToContext, TSubscribeStatement } from './statements.js';

export const isPrevContext = (
	obj: TPayloadToContext<TKeyItems> | TPreviousToContext<TKeyItems>,
): obj is TPreviousToContext => {
	return Object.keys(obj).includes('prevContext');
};
export const isPayloadContext = (
	obj: TPayloadToContext<TKeyItems> | TPreviousToContext<TKeyItems>,
): obj is TPayloadToContext => {
	return Object.keys(obj).includes('payload');
};

export function isExpressionType<T extends TMappedKeys>(expression: any): expression is TMapped[T] {
	return Object.keys(ExpressionTypes).includes(expression);
}

export const isKeyItem = function (obj: any): obj is TKeyItemBase {
	const keys = Object.keys(obj);
	return keys.includes('KeyItemDeclaration') && Object.keys(obj.KeyItemDeclaration).includes('TargetProperty');
};
export const isKeyItemWithExpression = function (obj: any): obj is TKeyItemWithExpression {
	const isKey = isKeyItem(obj);
	if (isKey) {
		return Object.keys(obj.KeyItemDeclaration).includes('Expression');
	}
	return false;
};
export const isActionWithPayload = (action: TAction): action is TAction<TKeyItems> => {
	return Object.keys(action).includes('payload');
};

export const isSubscribeWithPayload = (subscribe: TSubscribeStatement): subscribe is TSubscribeStatement<TKeyItems> => {
	if (subscribe?.action) {
		const action = { subscribe };
		return Object.keys(action).includes('payload');
	}
	return false;
};
