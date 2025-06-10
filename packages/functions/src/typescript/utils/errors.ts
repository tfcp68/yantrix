export const ERRORS = {
	DIVISION_BY_ZERO: 'Division by 0',
	INVALID_NUMBER_OF_ARGUMENTS: 'Invalid number of arguments',
	INVALID_NUMERIC_ARGUMENT: 'Argument must be provided and be a valid number.',
	INVALID_BINARY_ARGUMENT: 'Argument must be provided and be a valid binary',
	INVALID_ARGUMENTS: 'Invalid arguments',
	INDEX_OUT_OF_RANGE: 'Index out of range',
	INVALID_PRECISION_ARGUMENT: 'Precision must be a valid number.',
	AT_LEAST_ONE_NUMBER_REQUIRED: 'At least 1 parameter must be provided and be a number.',
	ALL_ARGUMENTS_MUST_BE_NUMBERS: 'All arguments must be numbers.',
	LISTS_MUST_BE_ARRAYS: 'All arguments provided must be lists',
	MIN_TWO_LISTS_REQUIRED: 'At least 2 lists of the same length must be provided.',
	NON_EMPTY_LISTS_REQUIRED: 'All lists must have at least 1 number.',
	LISTS_MUST_BE_SAME_LENGTH: 'All lists provided must be the same length.',
	ALL_LIST_ITEMS_MUST_BE_NUMERIC: 'All items in the provided lists must be numbers.',
	UNEXPECTED_ERROR: 'An unexpected error has occurred.',
	ALL_ARGUMENTS_MUST_BE_STRINGS: 'All arguments must be strings.',
	ALL_ARGUMENTS_MUST_BE_LISTS: 'All arguments must be lists.',
	INVALID_LIST_ARGUMENT: 'Invalid List argument',
	LIST_LENGTH_MISMATCH: 'All List arguments must be of the same length',
} as const;

const errorTypes: Partial<Record<keyof typeof ERRORS, ErrorConstructor>> = {
	DIVISION_BY_ZERO: EvalError,
	INDEX_OUT_OF_RANGE: RangeError,
	UNEXPECTED_ERROR: Error,
};

export function invalid(errorKey: keyof typeof ERRORS, extra?: string): never {
	throw new (errorTypes[errorKey] ?? TypeError)(ERRORS[errorKey] + (extra ? `: ${extra}` : ''));
}
