export class InvalidInputError extends Error {
	constructor(messages?: string) {
		super(`Invalid diagram input: ${messages}`);
	}
}

export class BlankInputError extends Error {
	constructor(messages?: string) {
		super(`the diagram is empty. ${messages}`);
	}
}
