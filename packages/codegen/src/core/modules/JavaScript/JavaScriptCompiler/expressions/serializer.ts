import { ReservedInternalFunctionNames } from '@yantrix/functions';
import { eta } from '../../../../eta';

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
	if (ReservedInternalFunctionNames.includes(name)) {
		const expr = eta.render('js/shared/expressions/internalExpression', {
			functionName: name,
			automataRef: 'automata',
			actionsDictionaryRef: 'actionsDictionary',
			statesDictionaryRef: 'statesDictionary',
		});
		if (expr == null) throw new Error(`Eta render returned null for internalExpression: ${name}`);
		return `(() => ${expr.trim()})`;
	}
	return `functionDictionary.get('${name}')`;
}

export const expressionsSerializer = {
	getDefaultPropertyContext,
	getFunctionFromDictionary,
};
