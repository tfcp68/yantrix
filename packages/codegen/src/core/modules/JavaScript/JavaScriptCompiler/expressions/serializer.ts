import { eta } from '../../../../eta';

const internalsMap: Record<string, string> = {
	_currentEpoch: 'getEpoch()',
	_currentStateId: 'automata.state',
	_currentStateName: '(Object.keys(statesDictionary).find(k => statesDictionary[k] === automata.state) ?? null)',
	_currentActionId: 'automata.lastAction',
	_currentActionName: '(Object.keys(actionsDictionary).find(k => actionsDictionary[k] === automata.lastAction) ?? null)',
	_currentCycle: 'automata.currentCycle',
	_currentTimestamp: '_getCurrentTimestamp()',
	_currentTime: '_getCurrentTime()',
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
