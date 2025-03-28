import { checkUserFunctionsDefined, registerCustomFunctions } from './core';

export const functions = {
	serializer: checkUserFunctionsDefined,
	functions: {
		registerCustomFunctions,
	},
};
