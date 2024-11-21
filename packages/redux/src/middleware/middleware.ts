import { TCreateMiddleware } from './types';

/**
 * Creates middleware for integrating a finite state machine (FSM) with Redux.
 * The middleware transforms Redux actions into payloads for the FSM and returns actions back to Redux from the FSM context.
 *
 * @template ActionType - The type of Redux action, which should extend PayloadAction.
 * @template AutomataType - The type of FSM constructor.
 * @template StoreType - The Redux store type (defaults to any).
 *
 * @param {AutomataType} FSM - The FSM constructor to be used in the middleware.
 * @param {(action: ActionType) => TInferAutomataPayload<AutomataType>} mapActionToFSMPayload - Function that transforms a Redux action into an FSM payload.
 * It takes a Redux action and returns an object of the form `{ action, payload }` or `null` if the action should not be processed by the FSM.
 * @param {(context: TInferAutomataContext<AutomataType>) => ActionType} mapContextToAction - Function that transforms the FSM context back into a Redux action.
 * It takes the FSM context and returns a Redux action, which will be dispatched to the Redux store.
 *
 * @returns {Middleware<ActionType, StoreType>} The Redux middleware function, which can be used in store configuration.
 *
 * @example
 * const middleware = createMiddleware(
 *   TrafficLightAutomata,
 *   (action) => action.type === 'SWITCH' ? { action: 'Switch', payload: null } : null,
 *   (context) => ({
 *     type: 'UPDATE_TRAFFIC_LIGHT',
 *     payload: { state: context.state, counter: context.counter }
 *   })
 * );
 */

export const createMiddleware: TCreateMiddleware = (FSM, mapActionToFSMPayload, mapContextToAction) => {
	const fsmInstance = new FSM();
	return () => next => (action) => {
		const fsmPayload = mapActionToFSMPayload(action as any);

		if (fsmPayload) {
			fsmInstance.dispatch(fsmPayload);
		}

		const newAction = mapContextToAction(fsmInstance.getContext());

		return next(newAction);
	};
};
