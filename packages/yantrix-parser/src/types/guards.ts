import { TContextReducer } from '../types/statements';
import { TKeyItemReducer, TKeyItemWithExpression } from './keyItem';

export const isKeyItemBase = (obj: any): obj is TKeyItemReducer => {
	return typeof obj === 'object' && Object.keys(obj).includes('expressionType');
};

export const isContextWithReducer = (obj: any): obj is TContextReducer => {
	return typeof obj === 'object' && Object.keys(obj).includes('context') && Object.keys(obj).includes('reducer');
};

export const isKeyItemReference = (obj: any): obj is TKeyItemReducer => {
	return (
		typeof obj === 'object' &&
		Object.keys(obj).includes('identifier') &&
		Object.keys(obj).includes('expressionType')
	);
};

export const isKeyItemWithExpression = (obj: any): obj is TKeyItemWithExpression => {
	return typeof obj === 'object' && Object.keys(obj).includes('expression');
};
