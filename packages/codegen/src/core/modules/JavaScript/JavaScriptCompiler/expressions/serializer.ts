import { eta } from '../../../../eta';

const internalsMap: Record<string, string> = {
	currentEpoch: 'getEpoch()',
	currentStateId: 'automata.state',
	currentStateName: '(Object.keys(statesDictionary).find(k => statesDictionary[k] === automata.state) ?? null)',
	currentActionId: 'automata.lastAction',
	currentActionName: '(Object.keys(actionsDictionary).find(k => actionsDictionary[k] === automata.lastAction) ?? null)',
	currentCycle: 'automata.currentCycle',
};

function getDefaultPropertyContext(path: string, identifier: string, expression?: string) {
	const rendered = eta.render('js/shared/expressions/context/defaultPropertyContext', {
		path,
		identifier,
		expression: expression ?? null,
	});
	if (rendered == null) throw new Error('Eta render returned null for defaultPropertyContext');
	return rendered.trim();
}

function getFunctionFromDictionary(name: string) {
	if (Object.hasOwn(internalsMap, name)) {
		return `(() => ${internalsMap[name]})`;
	}
	return `functionDictionary.get('${name}')`;
}

export const expressionsSerializer = {
	getDefaultPropertyContext,
	getFunctionFromDictionary,
};
