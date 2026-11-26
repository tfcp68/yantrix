import { BasicActionDictionary, BasicEventDictionary, BasicStateDictionary } from '@yantrix/automata';
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
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
	eventDictionary: BasicEventDictionary;
}) {
	const dictionaries: TDictionaries = [];
	dictionaries.push(
		`export const statesDictionary = ${JSON.stringify(props.stateDictionary.getDictionary(), null, 2)}`,
	);
	dictionaries.push(
		`export const actionsDictionary = ${JSON.stringify(props.actionDictionary.getDictionary(), null, 2)}`,
	);
	const names = Object.keys(props.eventDictionary.getDictionary());
	if (names.length > 0) {
		const entries = names.map((name) => {
			const key = JSON.stringify(name);
			return `[${key}]: GlobalEventDictionary.resolveEvent(${key})`;
		});
		dictionaries.push(`export const eventDictionary = { ${entries.join(', ')} }`);
	}
	dictionaries.push(`export const functionDictionary = new FunctionDictionary();`);
	imports.functions.checkForCyclicDependencies({
		dependencyGraph: props.dependencyGraph,
	});
	return dictionaries;
}
