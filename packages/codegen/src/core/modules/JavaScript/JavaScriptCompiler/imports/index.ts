import { buildDependencyGraph, checkForCyclicDependencies } from './core';
import { importsSerializer } from './serializer';

export * from './types';

export const imports = {
	serializer: importsSerializer,
	functions: {
		checkForCyclicDependencies,
		buildDependencyGraph,
	},
};
