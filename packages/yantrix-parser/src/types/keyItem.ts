import { ExpressionTypes } from '../constants/index.js';
import { TExpression } from './expressions.js';

export const KeyItemType = {
	RAW: 'raw',
	REDUCER: 'reducer',
} as const;

type TKeyItemKeys = keyof typeof KeyItemType;

export type TKeyItemBase = {
	identifier: string;
	expression?: TExpression;
};

export type TKeyItemReducer = {
	expressionType?: typeof ExpressionTypes.Constant | typeof ExpressionTypes.Context | typeof ExpressionTypes.Payload;
} & Partial<TKeyItemBase>;

export type TKeyItem<X extends (typeof KeyItemType)[TKeyItemKeys] = typeof KeyItemType.RAW> = {
	keyItem: X extends typeof KeyItemType.REDUCER ? TKeyItemReducer : TKeyItemBase;
};

export type TKeyItems<X extends (typeof KeyItemType)[TKeyItemKeys] = typeof KeyItemType.RAW> = Array<TKeyItem<X>>;

const t: TKeyItemReducer = {
	expression: {
		expressionType: ExpressionTypes.StringDeclaration,
		StringDeclaration: 'test',
	},
};
