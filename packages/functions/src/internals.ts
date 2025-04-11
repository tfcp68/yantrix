import { isNumber } from 'lodash-es';
import { GenericAutomata } from '@yantrix/automata';

// ==============================
// Built-ins: Internals
// ==============================

function currentStateId<T extends GenericAutomata>(_: new (...args: any[]) => T): (automata: T) => number | null { 
	return (automata: T) => automata.state;
}
function currentStateName<T extends GenericAutomata>(_: new (...args: any[]) => T, statesDictionary: Record<string, number>): (automata: T) => string | null {
	return (automata: T) => Object.entries(statesDictionary).find(([_, id]) => id === automata.state)?.[0] ?? null
}
function currentActionId<T extends GenericAutomata>(_: new (...args: any[]) => T): (automata: T) => number | null { 
	return (automata: T) => automata.lastAction;
}
function currentActionName<T extends GenericAutomata>(_: new (...args: any[]) => T, actionsDictionary: Record<string, number>): (automata: T) => string | null {
	return (automata: T) => Object.entries(actionsDictionary).find(([_, id]) => id === automata.lastAction)?.[0] ?? null
}
function currentCycle<T extends GenericAutomata>(_: new (...args: any[]) => T): (automata: T) => number { 
	return (automata: T) => automata.currentCycle;
}
function currentEpoch(epochRef: number) { 
	return () => epochRef;
}
function currentTimestamp(): number {
	return Date.now(); // in milliseconds, for microseconds need process.hrtime() from node.js
}
function currentTime(): string {
	return new Date().toISOString();
}
function random(min?: number, max?: number): number {
	if (isNumber(min) && isNumber(max)) return Math.floor(Math.random() * (max - min) + min);
	else return Math.round(Math.random());
}
function weightedRandom(object: { [key: string]: number }): number {
	// https://trekhleb.medium.com/weighted-random-in-javascript-4748ab3a1500

	// Check if any of the object's values is NaN
	for (const value of Object.values(object)) {
		if (Number.isNaN(value)) throw new Error('Weighted random object contains NaN values');
	}
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
		if (cumulativeWeights[i]! >= randomNumber) return object[objectKeys[i]!]!;
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
}

export const pureInternals = {
	currentTimestamp,
	currentTime,
	random,
	weightedRandom,
}