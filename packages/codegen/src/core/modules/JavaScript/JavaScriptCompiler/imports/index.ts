import { buildDependencyGraph, checkForCyclicDependencies } from './core';
import { importsSerializer } from './serializer';

export * from './types';

export const imports = {
	serializer: {
		getImportsCode: importsSerializer.getImportsCode,
		importAll: importsSerializer.importAll,
	},
	functions: {
		checkForCyclicDependencies,
		buildDependencyGraph,
	},
};
