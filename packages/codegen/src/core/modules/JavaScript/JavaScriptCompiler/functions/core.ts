import { builtInFunctions } from '@yantrix/functions';
import { TNullable } from '@yantrix/utils';
import { ExpressionTypes, TExpressionDefineMap, TInjectIdent } from '@yantrix/yantrix-parser';
import { DEFAULT_USER_FUNCTIONS_NAMESPACE } from '../../../../../constants';
import { TExpressionRecord, TStateDiagramMatrixIncludeNotes, TUserFunctionsDict } from '../../../../../types/common';
import { TDictionaries } from '../dictionaries';
import { getExpressionValueDefine } from '../expressions/core';
import { TDependencyGraph } from '../imports';

export function getFunctionBody(props: {
	expressions: TExpressionRecord;
	expression: TExpressionDefineMap;
}): string {
	if (props.expression.expressionType === ExpressionTypes.Function) {
		const { FunctionName, Arguments } = props.expression.FunctionDeclaration;

		const argsList = Arguments.map((arg) => {
			if (arg.expressionType === ExpressionTypes.Function) {
				return getFunctionBody({
					expression: arg,
					expressions: props.expressions,
				});
			} else {
				return getExpressionValueDefine({
					expression: arg,
					expressions: props.expressions,
				});
			}
		}).join(', ');

		return `(function() {
					const func = functionDictionary.get('${FunctionName}');
					return func(${argsList});
				})()`;
	} else {
		return getExpressionValueDefine({
			expression: props.expression,
			expressions: props.expressions,
		});
	}
}

export function checkUserFunctionsDefined(props: {
	injectedPath: TNullable<string>;
	injects: TInjectIdent[];
}) {
	const { injectedPath, injects } = props;
	const identifiers = injects.map(inject => `'${inject.identifier}'`);

	if (!injectedPath) return ``;

	return `
	
	(function (){
			const injects = [${identifiers.join(',')}]
			const defaults = ${DEFAULT_USER_FUNCTIONS_NAMESPACE}?.default ?? null

			if(defaults) {
				switch(typeof defaults) {
					case 'function': 
					  if(!defaults?.name) throw new Error('Default exported user functions must have a name');
						Object.assign(${DEFAULT_USER_FUNCTIONS_NAMESPACE}, {[defaults.name]: defaults});
						break;
					case 'object':
						if(Array.isArray(defaults)) {
							throw new Error('Default exported user functions must be an object or a function');
						} 
						Object.assign(${DEFAULT_USER_FUNCTIONS_NAMESPACE}, {...defaults});
						break;
					default:
						throw new Error('Default exported user functions must be a function or an object from ${injectedPath}');
				}
			}

			injects.forEach((identifier) => {
				if (!${DEFAULT_USER_FUNCTIONS_NAMESPACE}[identifier]) {
					throw new Error(\`Function \${identifier}\ is not defined in ${injectedPath}\`);
				}
				if(typeof ${DEFAULT_USER_FUNCTIONS_NAMESPACE}[identifier] !== 'function') {
					throw new Error(\`Function \${identifier}\ is not a function in ${injectedPath}\`);
				}
			});
		})()`;
}

export function registerCustomFunctions(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	dependencyGraph: TDependencyGraph;
	dictionaries: TDictionaries;
	expressions: TExpressionRecord;
	injectFunctions: TUserFunctionsDict;
}) {
	const { dictionaries, diagram, injectFunctions, dependencyGraph, expressions } = props;
	const newDictionary = dictionaries;
	const defines = diagram.states.flatMap(state => state.notes?.defines ?? []);
	const inject = diagram.states.flatMap(state => state.notes?.inject ?? []);

	const registered = new Set<string>();

	const registerFunction = (funcName: string, depth = 0) => {
		const defineFunction = defines.find(def => def.identifier === funcName);
		const injectFunction = inject.find(def => def.identifier === funcName);
		const isBuiltInIdentifier = Object.hasOwn(builtInFunctions, funcName) && (Boolean(defineFunction) || Boolean(injectFunction));

		if (registered.has(funcName)) {
			throw new TypeError(`Function identifier ${funcName} is already used`);
		};
		if (isBuiltInIdentifier) {
			throw new TypeError(`Function identifier ${funcName} should not be used as it is a built-in function`);
		}
		if (injectFunction && !injectFunctions.path) {
			throw new TypeError(`Function identifier ${funcName} is defined in the diagram but no inject file is provided`);
		}

		const dependencies = dependencyGraph.get(funcName) || new Set();

		for (const dep of dependencies) {
			if (!registered.has(dep)) {
				registerFunction(dep, depth + 1);
			}
		}
		if (injectFunction) {
			newDictionary.push(`functionDictionary.register('${funcName}', ${DEFAULT_USER_FUNCTIONS_NAMESPACE}['${funcName}']);`);
			registered.add(funcName);
		} else if (defineFunction) {
			const functionBody = getFunctionBody({
				expression: defineFunction.expression,
				expressions,
			});
			newDictionary.push(`functionDictionary.register('${funcName}', function(${defineFunction.Arguments.join(', ')}) {
						return ${functionBody};
					});`);
			registered.add(funcName);
		};
	};

	for (const funcName of dependencyGraph.keys()) {
		if (!registered.has(funcName)) {
			registerFunction(funcName);
		}
	}

	return newDictionary;
}
