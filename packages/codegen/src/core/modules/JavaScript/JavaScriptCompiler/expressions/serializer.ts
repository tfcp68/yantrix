const internalsMap: Record<string, string> = {
	currentEpoch: 'getEpoch()',
	currentStateId: 'automata.state',
	currentStateName: '(Object.keys(statesDictionary).find(k => statesDictionary[k] === automata.state) ?? null)',
	currentActionId: 'automata.lastAction',
	currentActionName: '(Object.keys(actionsDictionary).find(k => actionsDictionary[k] === automata.lastAction) ?? null)',
	currentCycle: 'automata.currentCycle',
};

function getDefaultPropertyContext(path: string, indetifier: string, expression?: string) {
	const fullPath = getReferenceString(path, indetifier);

	return `(function(){
						if(${path} !== null && ${fullPath} !== undefined && ${fullPath} !== null) {
							return ${path}['${indetifier}']
						}
							else {
								return ${expression ?? 'null'}
							}
					}())`;
}

function getReferenceString(path: string, identifier: string) {
	return `${path}['${identifier}']`;
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
