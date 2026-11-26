import { getEffectStatements } from '@yantrix/yantrix-parser';
import { TStateDiagramMatrixIncludeNotes } from '../../../../../types/common';
import { TEventEmitterVM } from '../events/core';

export type TEffectDeclarationIR = {
	identifier: string;
	modelTransformerIdentifier: string;
	metaKeys: string[];
	stateIds: string[];
};

export function getEffectDeclarations(diagram: TStateDiagramMatrixIncludeNotes): TEffectDeclarationIR[] {
	const declarations = new Map<string, TEffectDeclarationIR>();

	for (const state of diagram.states) {
		if (!state.notes) continue;

		for (const effect of getEffectStatements(state.notes)) {
			const declaration = declarations.get(effect.identifier);
			if (!declaration) {
				declarations.set(effect.identifier, {
					identifier: effect.identifier,
					modelTransformerIdentifier: effect.identifier,
					metaKeys: [...effect.metaKeys],
					stateIds: [state.id],
				});
				continue;
			}

			declaration.stateIds.push(state.id);
		}
	}

	return [...declarations.values()];
}

export function validateEffectProducers(declarations: TEffectDeclarationIR[], emitters: TEventEmitterVM[]): void {
	if (declarations.length === 0) return;
	const contracts = new Map(declarations.map(effect => [effect.identifier, effect.metaKeys]));
	for (const { stateId, events } of emitters) {
		for (const { eventIdentifier, metaEntries } of events) {
			const expected = contracts.get(eventIdentifier);
			if (!expected) continue;

			const keys = metaEntries.map(entry => entry.targetProperty);
			const emitted = new Set(keys);
			if (expected.length !== keys.length || !expected.every(key => emitted.has(key))) {
				throw new Error(`Effect "${eventIdentifier}" has conflicting Event Meta contracts in state "${stateId}": `
					+ `expected (${expected.join(', ')}), got (${keys.join(', ')})`);
			}
		}
	}
}
