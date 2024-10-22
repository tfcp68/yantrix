import { BasicActionDictionary, BasicEventDictionary, BasicStateDictionary } from '@yantrix/automata';
import { ExpressionTypes, TRefereneceType } from '@yantrix/yantrix-parser';

import { TStateDiagramMatrixIncludeNotes } from '../types/common.js';

export function fillDictionaries(
	diagram: TStateDiagramMatrixIncludeNotes,
	stateDictionary?: BasicStateDictionary,
	actionDictionary?: BasicActionDictionary,
	eventDictionary?: BasicEventDictionary,
): void {
	// fill state dictionary
	if (stateDictionary) {
		const stateKeys = diagram.states.map(s => s.id);
		stateDictionary.addStates({ keys: stateKeys });
	}

	// fill action dictionary
	if (actionDictionary) {
		for (const state of diagram.states) {
			for (const path of state.actionsPath.map(p => p.action)) {
				const firstAction = path[0]!;
				const isUniqueAction = actionDictionary.getActionValues({ keys: [firstAction] })[0] === null;
				if (!isUniqueAction) {
					continue;
				}
				actionDictionary.addActions({ keys: [firstAction] });
			}
		}
	}

	// fill event dictionary
	if (eventDictionary) {
		for (const state of diagram.states) {
			const emittedEventsKeys = state.notes?.emit.map(event => event.identifier);
			if (emittedEventsKeys && emittedEventsKeys.length > 0) {
				const uniqueKeys = emittedEventsKeys.filter(e => eventDictionary.getEventValues({ keys: [e] })[0] == null);
				eventDictionary.addEvents({ keys: uniqueKeys });
			}

			const subscribedEventsKeys = state.notes?.subscribe.map(event => event.identifier);
			if (subscribedEventsKeys && subscribedEventsKeys.length > 0) {
				const uniqueKeys = subscribedEventsKeys.filter(e => eventDictionary.getEventValues({ keys: [e] })[0] == null);
				eventDictionary.addEvents({ keys: uniqueKeys });
			}
		}
	}
}
export const pathRecord: Record<TRefereneceType, string> = {
	[ExpressionTypes.Constant]: 'constant',
	[ExpressionTypes.Context]: 'prevContext',
	[ExpressionTypes.Payload]: 'payload',
};
