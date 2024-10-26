import { isFunctionExpression, TContextItem, TContextReducer, TKeyItemReducer } from '@yantrix/yantrix-parser';
import { TStateIncludingNotes } from '../../../../../types/common';

export function parseStateNotes(state: TStateIncludingNotes): [string, { context: string; reducer: string }] | null {
	const notes = state.notes;
	if (!notes) return null;

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

	return [state.id, {
		context: mappedContextType,
		reducer: mappedReducerType,
	}];
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
