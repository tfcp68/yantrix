import { isNumber } from 'lodash-es';

// ==============================
// Built-ins: Internals
// ==============================

// TODO
export function _currentStateName() { }
export function _currentStateId() { }
export function _currentActionName() { }
export function _currentActionId() { }
export function currentEpoch() { }

export function currentTimestamp(): number {
	return Date.now(); // in milliseconds, for microseconds need process.hrtime() from node.js
}
export function currentTime(): string {
	return new Date().toISOString();
}
export function random(): number;
export function random(min?: number, max?: number): number {
	if (isNumber(min) && isNumber(max)) return Math.floor(Math.random() * (max - min) + min);
	else return Math.round(Math.random());
}
export function weightedRandom(object: { [key: string]: number }): number {
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
