import { getExpressionValue, setupExpressions } from './core';
import { registerCustomFunctions } from './functions';
import { expressionsSerializer } from './serializer';

export const expressions = {
	serializer: expressionsSerializer,
	functions: {
		getExpressionValue,
		registerCustomFunctions,
		setupExpressions,
	},
};
