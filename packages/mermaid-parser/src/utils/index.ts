import { EndState, StartState } from '../constants';

const validStateRegex = /^[a-z][\w-]{0,254}$/i;
export function isValidStateId(state: string): boolean {
	return state === StartState || state === EndState || validStateRegex.test(state);
}
export function isValidInternalId(str: string): boolean {
	return (
		str.split(', ').length === 3
		&& str[0] !== undefined && str[1] !== undefined && str[2] !== undefined
		&& isValidStateId(str[0]) && isValidStateId(str[1])
	);
}
