import { TStateDiagramMatrixIncludeNotes } from '../../../../../types/common';
import { parseStateNotes } from './functions';

function getContextReducerTypes(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	className: string;
}) {
	const states = props.diagram.states;
	const automataTypes = [];
	const typeMap: Record<string, { context: any; reducer: any }> = {};
	for (const state of states) {
		const parseResult = parseStateNotes(state);
		if (parseResult !== null) {
			const [stateId, parsedTypes] = parseResult;
			typeMap[stateId] = parsedTypes;
			automataTypes.push(`${parsedTypes.context}${parsedTypes.reducer}`);
		}
	}
	automataTypes.push(`
		type TContext = {
			${Object.keys(typeMap).map(state => `"${state}": ${state}_Context`).join(',\n')}
		}
	`);
	automataTypes.push(`
		export type TAutomataContext${props.className ?? ''}<T extends keyof TContext> = TContext[T];
	`);
	automataTypes.push(`
		type TReducer = {
			${Object.keys(typeMap).map(state => `"${state}": ${state}_Reducer`).join(',\n')}
		}
	`);
	automataTypes.push(`
		export type TAutomataReducer${props.className ?? ''}<T extends keyof TReducer> = TReducer[T];
	`);
	return automataTypes.join('\n');
}

function getActionsTypes(props: {
	className: string;
}) {
	return `export type TActions${props.className} = keyof typeof actionsDictionary;`;
}

function getStateTypes(props: {
	className: string;
}) {
	return `export type TStates${props.className} = keyof typeof statesDictionary;`;
}

export const typeSerializer = {
	getContextReducerTypes,
	getActionsTypes,
	getStateTypes,
} as const;
