import {
	TAutomataActionPayload,
	TAutomataBaseActionType,
} from '@yantrix/core';
import { deepEqual } from '@yantrix/utils';
import { IYantrixBoundStore } from '../types';

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
	const contextChanged = !deepEqual(previousContext, nextContext);

	if (stateChanged || contextChanged) {
		store.changeState();
	}
}
