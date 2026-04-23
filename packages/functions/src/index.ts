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

import { isNumber } from 'lodash-es';
import * as conditionals from './typescript/conditionals';
import * as predicates from './typescript/predicates';
import * as transformers from './typescript/transformers';

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

function currentTimestamp(): number {
	if (typeof process !== 'undefined' && process.hrtime?.bigint !== undefined) {
		return Number(process.hrtime.bigint() / BigInt(1000));
	} else if (typeof performance !== 'undefined' && performance.now !== undefined) {
		return Math.floor(performance.now() * 1000);
	} else {
		return Date.now() * 1000;
	}
}

function currentTime(): string {
	return new Date().toISOString();
}

function random(min?: number, max?: number): number {
	if (isNumber(min) && isNumber(max)) return Math.floor(Math.random() * (max - min) + min);
	else return Math.round(Math.random());
}

function weightedRandom(object: { [key: string]: number }): string {
	// https://trekhleb.medium.com/weighted-random-in-javascript-4748ab3a1500

	const objectKeys: string[] = Object.keys(object);
	const objectWeights: number[] = Object.values(object);

	if (objectKeys.length === 0) throw new Error('Weighted random object is empty');

	for (const value of objectWeights) {
		if (!Number.isInteger(value)) throw new Error('Weighted random object contains non-integer values');
		else if (value <= 0) throw new Error('Weighted random object contains values of 0 or less');
	}

	const weightsSum = objectWeights.reduce((acc, weight) => acc + weight, 0);
	const cumulativeWeights: number[] = [];
	let cumulativeWeight = 0;
	for (let index = 0; index < objectWeights.length; index++) {
		cumulativeWeight += objectWeights[index]! / weightsSum;
		cumulativeWeights.push(cumulativeWeight);
	}

	const randomNumber = Math.random();
	for (let i = 0; i < cumulativeWeights.length; i++) {
		if (cumulativeWeights[i]! >= randomNumber) return objectKeys[i]!;
	}
	throw new Error('Unexpected error, could not get weighted random value');
}

export const internalFunctions = {
	currentTimestamp,
	currentTime,
	random,
	weightedRandom,
};

export const ReservedInternalFunctionNames: string[] = [];
