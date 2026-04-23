export interface ILoopInternalsContext {
	currentEpoch: number;
}

export interface IAutomataInternalsContext {
	currentStateId: number | null;
	currentStateName: string | null;
	currentCycle: number;
}

export interface IActionInternalsContext {
	currentActionId: number | null;
	currentActionName: string | null;
}

export interface IInternalsContext extends
	ILoopInternalsContext,
	IAutomataInternalsContext,
	IActionInternalsContext
{}
