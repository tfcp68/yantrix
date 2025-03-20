/**
 * @packageDocumentation
 *
 * This package defines built-in functions for the Yantrix framework, in JavaScript/TypeScript.
 * More complex functions can be built by combining and mixing these basic functions.
 *
 * See also:
 * [Functions](/syntax/140_functions.html)
 *
 * @showCategories
 * @module BuiltInFunctions
 */

import * as conditionals from './conditionals';
import * as predicates from './predicates';
import * as transformers from './transformers';

/**
 * @namespace
 * Functions that execute conditional logic.
 *
 * See also:
 * [Conditionals](/syntax/140_functions.html#built-ins-conditional-expressions)
 *
 */
export const Conditionals = {
	...conditionals,
};

/**
 * @namespace
 * Functions that evaluate boolean conditions.
 *
 * See also:
 * [Predicates](/syntax/150_predicates.html)
 */
export const Predicates = {
	...predicates,
};

/**
 * @namespace
 * Functions that transform data.
 *
 * See also:
 * [Transformers](/syntax/160_transformers.html)
 */
export const Transformers = {
	...transformers,
};

/**
 * @hidden
 */
export const builtInFunctions = {
	...conditionals,
	...predicates,
	...transformers,
};
