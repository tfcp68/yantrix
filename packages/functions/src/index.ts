import * as conditionals from './conditionals';
import * as predicates from './predicates';
import * as transformers from './transformers';

import { automataInternals, pureInternals } from './internals';


export const builtInFunctions = {
	...conditionals,
	...predicates,
	...transformers,
};

// internals moved to separate object
export const internalFunctions = {
	...automataInternals,
	...pureInternals,
};

// only automata internals' names are reserved, codegen needs to be able to discriminate between pure & context-dependent internals
export const ReservedInternalFunctionNames = Object.keys(automataInternals);
