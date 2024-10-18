import { getInitialContextShape } from './core';
import { contextSerializer } from './serializer';

export const context = {
	contextSerializer,
	functions: {
		getInitialContextShape,
	},
};
