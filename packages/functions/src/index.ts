import * as conditionals from './conditionals';
import * as internals from './internals';
import * as predicates from './predicates';
import * as transformers from './transformers';

export const builtInFunctions = {
	...conditionals,
	...predicates,
	...transformers,
};

// internals moved to separate object for now, Function Dictionary does not allow names like "_currentActionName" starting with underscore
export const internalFunctions = {
	...internals,
};
