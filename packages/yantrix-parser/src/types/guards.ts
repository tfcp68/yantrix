import { ExpressionTypes, TExpressionTypesKeys } from './expressions.js';
import { TKeyItemBase, TKeyItems, TKeyItemWithExpression } from './keyItem.js';
import { TAction, TSubscribeStatement } from './statements.js';

export function isExpressionType<T extends TExpressionTypesKeys>(
  expression: any,
): expression is (typeof ExpressionTypes)[T] {
  return Object.keys(ExpressionTypes).includes(expression);
}

export const isKeyItem = function (obj: any): obj is TKeyItemBase {
  return (
    Object.hasOwn(obj, 'KeyItemDeclaration') &&
    Object.hasOwn(obj?.KeyItemDeclaration, 'TargetProperty')
  );
};
export const isKeyItemWithExpression = function (
  obj: any,
): obj is TKeyItemWithExpression<any> {
  const isKey = isKeyItem(obj);
  if (isKey) {
    return Object.hasOwn(obj?.KeyItemDeclaration, 'Expression');
  }
  return false;
};
export const isActionWithPayload = (
  action: TAction,
): action is TAction<TKeyItems> => {
  return Object.keys(action).includes('payload');
};

export const isSubscribeWithPayload = (
  subscribe: TSubscribeStatement,
): subscribe is TSubscribeStatement<TKeyItems> => {
  if (subscribe?.action) {
    const action = { subscribe };
    return Object.keys(action).includes('payload');
  }
  return false;
};
