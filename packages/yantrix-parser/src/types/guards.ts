import { TExpressionTypes } from './expressions.js';
import { TKeyItemBase, TKeyItems, TKeyItemWithExpression } from './keyItem.js';
import {
  TAction,
  TContext,
  TPayloadToContext,
  TPreviousToContext,
  TSubscribeStatement,
} from './statements.js';

export function isExpressionType<T extends typeof TExpressionTypes>(
  expression: any,
): expression is T[keyof T] {
  return Object.values(TExpressionTypes).includes(expression);
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
    return Object.hasOwn(obj?.KeyItemDeclaration, 'ExpressionType');
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

export const isContextWithPayload = (
  context: TContext,
): context is TPayloadToContext => {
  return Object.keys(context).includes('payload');
};
export const isContextWithPreviousContext = (
  context: TContext,
): context is TPreviousToContext => {
  return Object.keys(context).includes('prevContext');
};
