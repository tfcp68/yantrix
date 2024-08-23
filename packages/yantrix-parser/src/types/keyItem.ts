import { TExpression, TMappedKeys, TRefereneceType } from './expressions.js';

export const KeyItemType = {
	RAW: 'raw',
	REDUCER: 'reducer',
} as const;

type TKeyItemKeys = keyof typeof KeyItemType;

export type TKeyItemBase = {
	identifier: string;
};

export type TKeyItemWithExpression<T extends TMappedKeys = TMappedKeys> = {
	expression: TExpression<T>;
} & TKeyItemBase;

type TKeyItemEmptyOrExpression = TKeyItemBase | TKeyItemWithExpression;

export type TKeyItemReducer<T extends TRefereneceType = TRefereneceType> = {
	expressionType: T;
} & TKeyItemEmptyOrExpression;

export type TKeyItemReducerOrExpression = TKeyItemReducer | { expression: TExpression };

export type TKeyItem<X extends (typeof KeyItemType)[TKeyItemKeys] = typeof KeyItemType.RAW> = {
	keyItem: X extends typeof KeyItemType.REDUCER ? TKeyItemReducerOrExpression : TKeyItemEmptyOrExpression;
};

export type TKeyItems<X extends (typeof KeyItemType)[TKeyItemKeys] = typeof KeyItemType.RAW> = Array<TKeyItem<X>>;
