import * as conditionals from './conditionals';
import * as predicates from './predicates';
import * as transformers from './transformers';
import { isIterable } from './types/guards';

console.log(isIterable('awdawwa'));

export const builtInFunctions = {
	...conditionals,
	...predicates,
	...transformers,
};
