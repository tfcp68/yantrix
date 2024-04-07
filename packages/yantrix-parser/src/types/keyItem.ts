import { TExpressionMapped, TExpressionTypes } from './expressions.js';

type TKeyItemBase = {
	KeyItemDeclaration: {
		TargetProperty: string;
	};
};
type TKeyItemWithExpression<T extends TExpressionTypes> = {
	KeyItemDeclaration: {
		TargetProperty: string;
		Expression: TExpressionMapped<T>;
		expressionType: T;
	};
};

export type TKeyItemTypes<K extends TExpressionTypes | undefined = undefined> =
	K extends TExpressionTypes ? TKeyItemWithExpression<K> : TKeyItemBase;

export type TKeyItem<
	T extends TExpressionTypes | undefined = TExpressionTypes | undefined,
> = TKeyItemTypes<T>;

export type TKeyItems = TKeyItem[];

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
