import { TMapped, TMappedKeys } from './expressions.js';

export type TKeyItemBase = {
	KeyItemDeclaration: {
		TargetProperty: string;
	};
};

export type TKeyItemWithExpression<T extends TMappedKeys = TMappedKeys> = {
	KeyItemDeclaration: {
		Expression: {
			expressionType: T;
			value: TMapped[T];
		};
	};
} & TKeyItemBase;

export type TKeyItemTypes<K extends TMappedKeys | undefined = undefined> = K extends TMappedKeys
	? TKeyItemWithExpression<K>
	: TKeyItemBase;

export type TKeyItem<T extends TMappedKeys | undefined = TMappedKeys | undefined> = TKeyItemTypes<T>;

export type TKeyItems = TKeyItem[];
