import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import { TExpressionRecord, TStateDiagramMatrixIncludeNotes } from '../../../../../types/common';
import { context } from '../context';
import { expressions } from '../expressions';
import { forks } from '../forks';
import { imports, TDependencyGraph } from '../imports';
import { TDictionaries } from './types';

export function getObjectKeysMap(dict: Record<any, any>) {
	const obj: Record<string, string> = {};
	Object.keys(dict).forEach((key: string) => {
		obj[key] = key;
	});
	return obj;
}

export function setupDictionaries(props: {
	dependencyGraph: TDependencyGraph;
	diagram: TStateDiagramMatrixIncludeNotes;
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
	expressionRecord: TExpressionRecord;
}) {
	let dictionaries: TDictionaries = [];
	dictionaries.push(
		`export const statesDictionary = ${JSON.stringify(props.stateDictionary.getDictionary(), null, 2)}`,
	);
	dictionaries.push(
		`export const actionsDictionary = ${JSON.stringify(props.actionDictionary.getDictionary(), null, 2)}`,
	);
	dictionaries.push(`const reducer = {${context.contextSerializer.getStateToContext({
		diagram: props.diagram,
		stateDictionary: props.stateDictionary,
		actionDictionary: props.actionDictionary,
		expressions: props.expressionRecord,
	}).join(',\n\t')}}`);
	dictionaries.push(`const predicates = {${forks.serializer.createPredicates({
		expressionRecord: props.expressionRecord,
		actionDictionary: props.actionDictionary,
		stateDictionary: props.stateDictionary,
		diagram: props.diagram,
	})}}`);
	dictionaries.push(`export const functionDictionary = new FunctionDictionary();`);
	dictionaries.push(`functionDictionary.register(builtInFunctions);`);
	dictionaries.push();
	imports.functions.checkForCyclicDependencies({
		dependencyGraph: props.dependencyGraph,
	});
	dictionaries = expressions.functions.registerCustomFunctions({
		diagram: props.diagram,
		expressions: props.expressionRecord,
		dependencyGraph: props.dependencyGraph,
		dictionaries,
	});
	return dictionaries;
}
