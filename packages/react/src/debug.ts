import { TAutomataActionPayload, TAutomataBaseActionType, TAutomataBaseStateType, TAutomataStateContext, uniqId } from '@yantrix/core';
import { TPreviousContext, TTraceTransaction } from './types';

export function trace<
	S extends TAutomataBaseStateType = TAutomataBaseStateType,
	A extends TAutomataBaseActionType = TAutomataBaseActionType,
	C extends { [K in S]: any } = { [K in S]: any },
	P extends { [K in A]: any } = { [K in A]: any },
>(
	lastAction: TAutomataActionPayload<A, P>,
	previousContext: TAutomataStateContext<S, C> | TPreviousContext,
): TTraceTransaction<S, A, C, P> {
	return {
		lastPayload: lastAction,
		previousContext: previousContext as TAutomataStateContext<S, C>,
		timestamp: new Date(),
		id: uniqId(10),
	};
}
