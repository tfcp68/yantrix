import { getExpressionValue, setupExpressions } from './core';
import { expressionsSerializer } from './serializer';

export const expressions = {
	serializer: expressionsSerializer,
	functions: {
		getExpressionValue,
		setupExpressions,

	},
};
