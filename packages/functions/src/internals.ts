import { GenericAutomata, TAbstractConstructor } from '@yantrix/automata';
import { isNumber } from 'lodash-es';

// ==============================
// Built-ins: Internals
// ==============================

/**
 * Wrapper for a function that retrieves the current state ID of the automata.
 *
 * @template T - The type of the automata.
 *
 * @param automataClass - The constructor of the automata.
 * @returns A function that takes an automata instance and returns its current state ID or null.
 */
function currentStateId<T extends GenericAutomata>(automataClass: TAbstractConstructor<T>): (automata: T) => number | null { 
	return (automata: T) => automata instanceof automataClass ? automata.state : null;
}
/**
 * Wrapper for a function that retrieves the current state name of the automata after lookup in the states dictionary.
 *
 * @template T - The type of the automata.
 *
 * @param automataClass - The constructor of the automata.
 * @param statesDictionary - A dictionary mapping state names to state IDs.
 * @returns A function that takes an automata instance and returns its current state name or null.
 */
function currentStateName<T extends GenericAutomata>(automataClass: TAbstractConstructor<T>, statesDictionary: Record<string, number>): (automata: T) => string | null {
	return (automata: T) => automata instanceof automataClass ? (Object.entries(statesDictionary).find(([_, id]) => id === automata.state)?.[0] ?? null) : null;
}
/**
 * Wrapper for a function that retrieves the current(i.e last dispatched) action ID of the automata.
 *
 * @template T - The type of the automata.
 *
 * @param automataClass - The constructor of the automata.
 * @returns A function that takes an automata instance and returns its last action ID or null.
 */
function currentActionId<T extends GenericAutomata>(automataClass: TAbstractConstructor<T>): (automata: T) => number | null { 
	return (automata: T) => automata instanceof automataClass ? automata.lastAction : null;
}
/**
 * Wrapper for a function that retrieves the current(i.e last dispatched) action name of the automata after lookup in actions dictionary.
 *
 * @template T - The type of the automata.
 *
 * @param automataClass - The constructor of the automata.
 * @param actionsDictionary - A dictionary mapping action names to action IDs.
 * @returns A function that takes an automata instance and returns its last action name or null.
 */
function currentActionName<T extends GenericAutomata>(automataClass: TAbstractConstructor<T>, actionsDictionary: Record<string, number>): (automata: T) => string | null {
	return (automata: T) => automata instanceof automataClass ? (Object.entries(actionsDictionary).find(([_, id]) => id === automata.lastAction)?.[0] ?? null) : null;
}
/**
 * Wrapper for a function that retrieves the current reduction cycle of the FSM.
 *
 * @template T - The type of the automata.
 *
 * @param automataClass - The constructor of the automata.
 * @returns A function that takes an automata instance and returns its current cycle.
 */
function currentCycle<T extends GenericAutomata>(automataClass: TAbstractConstructor<T>): (automata: T) => number | null { 
	return (automata: T) => automata instanceof automataClass ? automata.currentCycle : null;
}
/**
 * Wrapper for a function that retrieves the current epoch (or global reduction cycle counter for all automatas).
 *
 * @param epochRef - The epoch reference value.
 * @returns A function that returns the epoch reference.
 */
function currentEpoch(epochRef: number) { 
	return () => epochRef;
}
/**
 * Retrieves the current timestamp in milliseconds.
 *
 * @returns The current timestamp in milliseconds since the Unix epoch.
 */
function currentTimestamp(): number {
	return Date.now(); // in milliseconds, for microseconds need process.hrtime() from node.js
}
/**
 * Retrieves the current time in ISO-8601 format.
 *
 * @returns The current time as a string in ISO-8601 format.
 */
function currentTime(): string {
	return new Date().toISOString();
}
/**
 * Generates a random number within a specified range or as a binary value.
 *
 * @param min - The minimum value of the range (inclusive).
 * @param max - The maximum value of the range (exclusive).
 * @returns A random number within the range if both min and max are provided, otherwise 0 or 1.
 */
function random(min?: number, max?: number): number {
	if (isNumber(min) && isNumber(max)) return Math.floor(Math.random() * (max - min) + min);
	else return Math.round(Math.random());
}
/**
 * Generates a weighted random value based on the provided object.
 *
 * @param object - An object where keys are items and values are their weights.
 * @returns A randomly selected value based on the weights.
 * @throws An error if the object contains NaN values or if no value can be selected.
 */
function weightedRandom(inputObject: { [key: string]: number }): string {
	// https://trekhleb.medium.com/weighted-random-in-javascript-4748ab3a1500

	// Check if any of the object's values is NaN or negative
	for (const value of Object.values(inputObject)) {
		if (Number.isNaN(value)) throw new Error('Weighted random object contains NaN values');
		else if (value < 0) throw new Error('Weighted random object contains negative values');
	}

	// remove items with weights of 0 from object
	const object = Object.fromEntries(Object.entries(inputObject).filter(([_, value]) => value > 0));

	const objectKeys: string[] = Object.keys(object);
	const objectValues: number[] = Object.values(object);

	// prepare the list of cumulative weights
	const cumulativeWeights: number[] = [];
	for (let i = 0; i < objectValues.length; i++) {
		cumulativeWeights.push(objectValues[i]! + (cumulativeWeights[i - 1] || 0));
	}
	// random number from 0 to the highest cumulative weight value
	const randomNumber = Math.floor(Math.random() * cumulativeWeights[cumulativeWeights.length - 1]!);

	// find the index of the cumulative weight that is higher or equal than the random number,
	// return the key with the index
	for (let i = 0; i < cumulativeWeights.length; i++) {
		if (cumulativeWeights[i]! >= randomNumber) return objectKeys[i]!;
	}
	throw new Error('Unexpected error, could not get weighted random value');
}

export const automataInternals = {
	currentStateId,
	currentStateName,
	currentActionId,
	currentActionName,
	currentCycle,
	currentEpoch,
};

export const pureInternals = {
	currentTimestamp,
	currentTime,
	random,
	weightedRandom,
};
