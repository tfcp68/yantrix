export const ERRORS = {
	DIVISION_BY_ZERO: 'Division by 0 is not acceptable',
	INVALID_NUMBER_ARGUMENT: 'Argument must be provided and be a valid number.',
	INVALID_NUMBER_ARGUMENTS: 'Both arguments must be provided and be valid numbers.',
	AT_LEAST_ONE_NUMBER_REQUIRED: 'At least 1 parameter must be provided and be a number.',
	ALL_ARGUMENTS_MUST_BE_NUMBERS: 'All arguments must be numbers.',
	LISTS_MUST_BE_ARRAYS: 'All arguments provided must be lists',
	MIN_TWO_LISTS_REQUIRED: 'At least 2 lists of the same length must be provided.',
	NON_EMPTY_LISTS_REQUIRED: 'All lists must have at least 1 number.',
	LISTS_MUST_BE_SAME_LENGTH: 'All lists provided must be the same length.',
	ALL_LIST_ITEMS_MUST_BE_NUMBERS: 'All items in the provided lists must be numbers.',
	UNEXPECTED_ERROR: 'An unexpected error has occurred.',
} as const;

export function invalid(errorKey: keyof typeof ERRORS): never {
	throw new TypeError(ERRORS[errorKey]);
}
