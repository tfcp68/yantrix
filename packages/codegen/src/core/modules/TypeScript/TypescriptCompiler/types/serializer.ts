import { isFunctionExpression, TContextItem, TContextReducer, TKeyItemReducer } from '@yantrix/yantrix-parser';
import { TStateDiagramMatrixIncludeNotes, TStateIncludingNotes } from '../../../../../types/common';

function createTypes(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
}) {
	const states = props.diagram.states;
	const stateTypes = [];
	for (const state of states) {
		const parsedTypes = parseStateNotes(state);
		stateTypes.push(parsedTypes);
	}
	return stateTypes.join('\n');
}

function parseStateNotes(state: TStateIncludingNotes): string {
	const notes = state.notes;
	if (!notes) return '';

	const contextTypes = [];
	const reducerTypes = [];
	for (const contextStatement of notes.contextDescription) {
		const contextType = parseStatementContext(contextStatement);
		contextTypes.push(contextType);

		const reducerType = parseStatementReducer(contextStatement as TContextReducer);
		reducerTypes.push(reducerType);
	}
	const mappedContextType = `type ${state.id}_Context = ${contextTypes.join(' | ')}\n`;
	const mappedReducerType = `type ${state.id}_Reducer = ${reducerTypes.join(' | ')}\n`;

	return `${mappedContextType}${mappedReducerType}`;
}

function parseStatementContext(contextStatement: TContextItem) {
	const contextKeyItems = [];
	const { context } = contextStatement;
	for (const { keyItem } of context) {
		contextKeyItems.push(`${keyItem.identifier}: any`);
	}
	const contextType = `{ ${contextKeyItems.join(', ')} }`;
	return contextType;
}

function parseStatementReducer(contextStatement: TContextReducer) {
	if (!contextStatement.reducer) return [];
	const reducerKeyItems = [];
	const { reducer } = contextStatement;
	for (const { keyItem } of reducer) {
		if (itemIsReducer(keyItem)) {
			reducerKeyItems.push(`${keyItem.identifier}: any`);
		} else if (isFunctionExpression(keyItem.expression)) {
			reducerKeyItems.push(`${keyItem.expression.FunctionDeclaration.FunctionName}: TAutomataFunction`);
		}
	}
	const reducerType = `{ ${reducerKeyItems.join(', ')} }`;
	return reducerType;
}

function itemIsReducer(obj: any): obj is TKeyItemReducer {
	return obj != null
		&& Object.hasOwn(obj, 'identifier')
		&& obj.identifier != null
		&& Object.hasOwn(obj, 'expressionType')
		&& obj.expressionType != null;
}

export const typeSerializer = {
	createTypes,
} as const;
