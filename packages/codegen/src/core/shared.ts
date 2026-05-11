import { BasicActionDictionary, BasicEventDictionary, BasicStateDictionary } from '@yantrix/automata';
import {
	getEmitStatements,
	getSubscribeStatements,
	hasByPass,
} from '@yantrix/yantrix-parser';

import { ByPassAction } from '../constants.js';
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
			if (!state.notes) continue;

			const emitStatements = getEmitStatements(state.notes);
			const emittedEventsKeys = emitStatements.map(emit => emit.identifier);
			if (emittedEventsKeys.length > 0) {
				const uniqueKeys = emittedEventsKeys.filter(e => eventDictionary.getEventValues({ keys: [e] })[0] == null);
				eventDictionary.addEvents({ keys: uniqueKeys });
			}

			const subscribeStatements = getSubscribeStatements(state.notes);
			const subscribedEventsKeys = subscribeStatements.map(sub => sub.identifier);
			if (subscribedEventsKeys.length > 0) {
				const uniqueKeys = subscribedEventsKeys.filter(e => eventDictionary.getEventValues({ keys: [e] })[0] == null);
				eventDictionary.addEvents({ keys: uniqueKeys });
			}
		}
	}
}

/**
 * @description
 * Finds all states with "byPass" note and returns array of their IDs.
 * "byPass" note should have one transition to the next state.
 * If there are more than one transition then error is thrown.
 * If there is no transition then error is thrown.
 * If state is not found in the dictionary then error is thrown.
 * @param {TStateDiagramMatrixIncludeNotes} diagram
 * @param {BasicStateDictionary} stateDictionary
 * @returns {number[]}
 */
export function getStatesByPass(diagram: TStateDiagramMatrixIncludeNotes, stateDictionary: BasicStateDictionary) {
	const byPassed: number[] = [];

	diagram.states.forEach((state) => {
		if (state.notes && hasByPass(state.notes)) {
			const actionChains = diagram.actionChains[state.id];

			if (!actionChains) throw new Error(`ByPassed state ${state.id} doesn\'t have transition`);
			const byPassAction = actionChains[ByPassAction];

			if (!byPassAction) {
				throw new Error(`ByPass action ${ByPassAction} not found for state ${state.id}`);
			}

			byPassAction.chains.forEach(({ chain }) => {
				if (byPassAction.chains.length > 1 && chain.length === 0) {
					throw new Error(`ByPass action ${ByPassAction} should have more than one transition`);
				}
			});

			const value = stateDictionary.getStateValues({ keys: [state.id] })[0];
			if (!value) throw new Error(`State ${state.id} not found`);

			byPassed.push(value);
		}
	});

	return byPassed;
}

/**
 * Reference type to path mapping for code generation.
 */
export const pathRecord: Record<string, string> = {
	constant: 'constant',
	context: 'prevContext',
	payload: '_payload',
};
