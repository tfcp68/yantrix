import { ExpressionTypes } from '../constants/index.js';
import { TExpression } from './expressions.js';

export const KeyItemType = {
	RAW: 'raw',
	REDUCER: 'reducer',
} as const;

type TKeyItemKeys = keyof typeof KeyItemType;

export type TKeyItemBase = {
	identifier: string;
};

export type TKeyItemWithExpression = {
	expression: TExpression;
} & TKeyItemBase;

type TKeyItemEmptyOrExpression = TKeyItemBase | TKeyItemWithExpression;

export type TKeyItemReducer = {
	expressionType: typeof ExpressionTypes.Constant | typeof ExpressionTypes.Context | typeof ExpressionTypes.Payload;
} & TKeyItemEmptyOrExpression;

export type TKeyItemReducerOrExpression = TKeyItemReducer | { expression: TExpression };

export type TKeyItem<X extends (typeof KeyItemType)[TKeyItemKeys] = typeof KeyItemType.RAW> = {
	keyItem: X extends typeof KeyItemType.REDUCER ? TKeyItemReducerOrExpression : TKeyItemEmptyOrExpression;
};

export type TKeyItems<X extends (typeof KeyItemType)[TKeyItemKeys] = typeof KeyItemType.RAW> = Array<TKeyItem<X>>;
