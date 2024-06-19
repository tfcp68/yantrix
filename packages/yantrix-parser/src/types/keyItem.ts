import { TExpression, TMapped, TMappedKeys } from './expressions.js';

export type TKeyItemBase = {
	KeyItemDeclaration: {
		TargetProperty: string;
	};
};

export type TKeyItemWithExpression<T extends TMappedKeys> = {
	KeyItemDeclaration: {
		Expression: TExpression<T>;
		TargetProperty: string;
	};
} & TKeyItemBase;

export type TKeyItemTypes<K extends TMappedKeys | undefined = undefined> = K extends TMappedKeys
	? TKeyItemWithExpression<K>
	: TKeyItemBase;

export type TKeyItem<T extends TMappedKeys | undefined = undefined> = TKeyItemTypes<T>;

export type TKeyItems = TKeyItem[];
