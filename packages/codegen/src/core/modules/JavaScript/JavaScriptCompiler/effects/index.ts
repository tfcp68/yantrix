import { getEffectDeclarations, validateEffectProducers } from './core';

export const effects = {
	functions: {
		getEffectDeclarations,
		validateEffectProducers,
	},
};

export type { TEffectDeclarationIR } from './core';
