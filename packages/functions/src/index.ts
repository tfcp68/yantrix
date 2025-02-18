import conditionals from './conditionals';
import * as predicates from './predicates';
import * as transformers from './transformers';

export const builtInFunctions = {
	...conditionals,
	...predicates,
	...transformers,
};
