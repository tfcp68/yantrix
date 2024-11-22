import { BasicActionDictionary, BasicEventDictionary, BasicStateDictionary } from '@yantrix/automata';
import { TExpressionRecord, TStateDiagramMatrixIncludeNotes } from '../../../../../types/common';
import { expressions } from '../expressions';
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
	eventDictionary: BasicEventDictionary;
	expressionRecord: TExpressionRecord;
}) {
	let dictionaries: TDictionaries = [];
	dictionaries.push(
		`export const statesDictionary = ${JSON.stringify(props.stateDictionary.getDictionary(), null, 2)}`,
	);
	dictionaries.push(
		`export const actionsDictionary = ${JSON.stringify(props.actionDictionary.getDictionary(), null, 2)}`,
	);
	if (Object.keys(props.eventDictionary.getDictionary()).length > 0) {
		dictionaries.push(
			`export const eventDictionary = ${JSON.stringify(props.eventDictionary.getDictionary(), null, 2)}`,
		);
		dictionaries.push(
			`GlobalEventDictionary.addEvents({
				keys: Object.keys(eventDictionary).filter(e => GlobalEventDictionary.getEventValues({ keys: [e] })[0] == null)
			 });`,
		);
	}
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
