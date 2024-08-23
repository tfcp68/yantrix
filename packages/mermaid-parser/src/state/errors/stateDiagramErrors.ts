export class ChoiceCycleError extends Error {
	constructor(messages?: string) {
		super(`Link to itself from the choice side. ${messages}`);
	}
}
