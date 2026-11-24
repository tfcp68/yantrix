import { isAction, Middleware, UnknownAction } from '@reduxjs/toolkit';

/**
 * Creates a Redux middleware that owns one FSM instance per store.
 * Unmapped Redux actions pass through. A matched action drives the machine,
 * and its new state and context can be mapped to a downstream Redux action.
 */
export function createMiddleware<FSMAction, Snapshot>(
	FSM: new () => { dispatch: (action: FSMAction) => unknown; getContext: () => Snapshot },
	mapActionToFSMPayload: (action: UnknownAction) => FSMAction | null,
	mapContextToAction: (snapshot: Snapshot) => UnknownAction | null,
): Middleware {
	return () => {
		const machine = new FSM();
		return next => (action) => {
			if (!isAction(action)) return next(action);
			const input = mapActionToFSMPayload(action);
			if (input === null) return next(action);

			machine.dispatch(input);
			const output = mapContextToAction(machine.getContext());
			return output === null ? action : next(output);
		};
	};
}
