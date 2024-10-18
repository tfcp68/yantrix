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
	return `functionDictionary.get('${name}')`;
}

export const expressionsSerializer = {
	getDefaultPropertyContext,
	getFunctionFromDictionary,
};
