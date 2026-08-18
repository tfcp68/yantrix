import { getEffectStatements } from '@yantrix/yantrix-parser';
import { TStateDiagramMatrixIncludeNotes } from '../../../../../types/common';

export type TEffectDeclarationIR = {
	identifier: string;
	modelTransformerIdentifier: string;
	metaKeys: string[];
	stateIds: string[];
};

function haveSameMetaKeys(left: string[], right: string[]): boolean {
	return left.length === right.length && left.every((key, index) => key === right[index]);
}

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

			if (!haveSameMetaKeys(declaration.metaKeys, effect.metaKeys)) {
				throw new Error(`Effect "${effect.identifier}" has conflicting Event Meta contracts`);
			}
			declaration.stateIds.push(state.id);
		}
	}

	return [...declarations.values()];
}
