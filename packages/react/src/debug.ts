import { TAutomataBaseActionType, TAutomataBaseStateType } from '@yantrix/automata';
import { uniqId } from '@yantrix/utils';
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
