import { getInitialContextShape } from './core';
import { contextSerializer } from './serializer';

export const context = {
	serializer: contextSerializer,
	functions: {
		getInitialContextShape,
	},
};
