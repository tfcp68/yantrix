import { TExpressionMapped, TMappedKeys } from './expressions.js';

export type TKeyItemBase = {
  KeyItemDeclaration: {
    TargetProperty: string;
  };
};
export type TKeyItemWithExpression<T extends TMappedKeys> = {
  KeyItemDeclaration: {
    TargetProperty: string;
    Expression: TExpressionMapped<T>;
    expressionType: T;
  };
};

export type TKeyItemTypes<K extends TMappedKeys | undefined = undefined> =
  K extends TMappedKeys ? TKeyItemWithExpression<K> : TKeyItemBase;

export type TKeyItem<
  T extends TMappedKeys | undefined = TMappedKeys | undefined,
> = TKeyItemTypes<T>;

export type TKeyItems = TKeyItem[];
