import { TAutomataBaseActionType, TAutomataBaseStateType, uniqId } from '@yantrix/core';
import { TPreviousContext, TTraceTransaction } from './types';

export const trace = (lastPayload: any, previousContext: TPreviousContext):
TTraceTransaction<TAutomataBaseStateType, TAutomataBaseActionType> => {
	return {
		lastPayload,
		previousContext,
		timestamp: new Date(),
		id: uniqId(10),
	};
};
