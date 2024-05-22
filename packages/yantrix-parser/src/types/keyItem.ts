import { TExpressionMapped, TExpressionTypes } from './expressions.js';

export type TKeyItemBase = {
	KeyItemDeclaration: {
		TargetProperty: string;
	};
};
export type TKeyItemWithExpression<T extends TExpressionTypes> = {
	KeyItemDeclaration: {
		TargetProperty: string;
		Expression: TExpressionMapped<T>;
		expressionType: T;
	};
};

export type TKeyItemTypes<K extends TExpressionTypes | undefined = undefined> = K extends TExpressionTypes
	? TKeyItemWithExpression<K>
	: TKeyItemBase;

export type TKeyItem<T extends TExpressionTypes | undefined = TExpressionTypes | undefined> = TKeyItemTypes<T>;

export type TKeyItems = TKeyItem[];
