import { EndState, StartState } from '../constants';

const validStateRegex = /^[a-z][\w-]{0,254}$/i;
const validFunctionRegex = /^[a-z]\w{0,254}\([\w, $#]+\)$/i;
const actionParamsRegex = /\(([\w=, $#]+)\)/;
const expressionValueRegex = /[$#]\w{0,254}(=\w+)?/;
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
function isValidFunctionId(str: string): boolean {
	return validFunctionRegex.test(str);
}

export function compareActionChains(a: string[], b: string[]) {
	const len = Math.max(a.length, b.length); // Compare up to the longest array's length

	for (let i = 0; i < len; i++) {
		const aVal = a[i] || ''; // Use empty string if array is shorter
		const bVal = b[i] || '';

		const aIsFunc = isValidFunctionId(aVal);
		const bIsFunc = isValidFunctionId(bVal);
		const aIsList = isValidInternalId(aVal);
		const bIsList = isValidInternalId(bVal);

		// 1. Sort function-like strings first
		if (aIsFunc && !bIsFunc) return -1;
		if (!aIsFunc && bIsFunc) return 1;

		// 2. Sort list-like strings last
		if (aIsList && !bIsList) return 1;
		if (!aIsList && bIsList) return -1;

		// 3. Lexicographical comparison if both are the same type
		const comparison = aVal.localeCompare(bVal);
		if (comparison !== 0) return comparison;
	}

	return 0; // If all elements are the same
}

export function extractActionId(str: string | undefined) {
	if (!str) return '';
	else return str.split('\(')[0]!.trim();
}

export function extractActionParams(str: string | undefined) {
	if (!str) return null;

	const match = str.match(actionParamsRegex);
	if (match && match[1]) {
		return match[1];
	} else {
		return null;
	}
}

export function hasExpressionValues(str: string | undefined) {
	if (!str) return false;

	const match = str.match(expressionValueRegex);
	if (match && match.length > 0) return true;
	else return false;
}
