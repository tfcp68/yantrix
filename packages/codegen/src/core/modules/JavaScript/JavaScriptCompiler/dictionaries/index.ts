import { setupDictionaries } from './core';
import { dictionariesSerializer } from './serializer';

export const dictionaries = {
	serializer: dictionariesSerializer,
	functions: {
		setupDictionaries,
	},
};

export * from './types';
