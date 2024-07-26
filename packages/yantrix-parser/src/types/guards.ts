import { TKeyItemBase } from './keyItem';

export const isRawKeyItem = (obj: any): obj is TKeyItemBase => {
	return Object.keys(obj).includes('identifier') && !Object.keys(obj).includes('expressionType');
};
