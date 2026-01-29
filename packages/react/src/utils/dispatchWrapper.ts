import {
	builtInFunctions,
	TAutomataActionPayload,
	TAutomataBaseActionType,
} from '@yantrix/core';
import { IYantrixBoundStore } from '../types';

/**
 * Параметры для performAutomataDispatch
 */
export type TPerformAutomataDispatchParams<
	ActionType extends TAutomataBaseActionType,
	PayloadType extends { [K in ActionType]: any },
> = {
	store: IYantrixBoundStore;
	action: TAutomataActionPayload<ActionType, PayloadType>;
};

export function dispatchWrapper<
	ActionType extends TAutomataBaseActionType,
	PayloadType extends { [K in ActionType]: any },
>(
	params: TPerformAutomataDispatchParams< ActionType, PayloadType>,
) {
	const { action, store } = params;
	const automata = store.getSnapshot();

	const prevCtx = automata.getContext();
	const previousState = prevCtx.state;
	const previousContext = prevCtx.context;

	const reduced = automata.dispatch(action);

	const nextState = reduced.state;
	const nextContext = reduced.context;

	const stateChanged = nextState !== previousState;
	const contextChanged = !builtInFunctions.isEqual(previousContext, nextContext);

	if (stateChanged || contextChanged) {
		store.changeState();
	}
}
