import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import { EndState, StartState } from '@yantrix/mermaid-parser';
import { TStateDiagramMatrixIncludeNotes } from '../types/common.js';

export type TActionToStateEntryModel = {
	state: number[];
	withPredicate: boolean;
	sourceStateId: number;
};

export type TActionToStateFromStateModel = Record<number, Record<number, TActionToStateEntryModel>>;

export function getActionToStateFromStateModel(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
}): TActionToStateFromStateModel {
	const { diagram, stateDictionary, actionDictionary } = props;
	const states = stateDictionary.getDictionary();
	const actions = actionDictionary.getDictionary();
	const model: TActionToStateFromStateModel = {};

	for (const { id } of diagram.states) {
		if (id === EndState) continue;
		const sourceStateId = states[id];
		if (sourceStateId == null) throw new Error(`State ${id} not found`);
		const row: Record<number, TActionToStateEntryModel> = {};
		for (const [target, transition] of Object.entries(diagram.transitions[id] ?? {})) {
			const targetId = states[target];
			if (targetId == null) throw new Error(`State ${target} not found`);
			for (const { action } of transition.actionsPath) {
				const actionId = actions[action[0]!];
				if (actionId == null) throw new Error(`Action ${action[0]} not found`);
				const entry = row[actionId] ??= { state: [], withPredicate: false, sourceStateId };
				if (!entry.state.includes(targetId)) entry.state.push(targetId);
				entry.withPredicate = entry.state.length > 1;
			}
		}
		model[sourceStateId] = row;
	}

	const startId = states[StartState];
	const globalActions = startId == null ? undefined : model[startId];
	if (globalActions) {
		for (const [stateId, localActions] of Object.entries(model)) {
			model[Number(stateId)] = { ...globalActions, ...localActions };
		}
	}
	return model;
}
