import { builtInFunctions, ReservedInternalFunctionNames } from '@yantrix/functions';
import { TNullable } from '@yantrix/utils';
import { DefineArgument, DefineFunction, DefineStatement, getDefineStatements, getInjectStatements, isDefineFunction, isNestedDefineFunction, NestedDefineFunction } from '@yantrix/yantrix-parser';
import { DEFAULT_USER_FUNCTIONS_NAMESPACE } from '../../../../../constants';
import { TExpressionRecord, TStateDiagramMatrixIncludeNotes, TUserFunctionsDict } from '../../../../../types/common';
import { TDictionaries } from '../dictionaries';
import { TDependencyGraph } from '../imports';
import { getExpressionValueDefine } from './core';

export function getFunctionBody(props: {
	expressions: TExpressionRecord;
	expression: DefineFunction | NestedDefineFunction;
}): string {
	const { name: FunctionName, args: Arguments } = props.expression;

	// If function name is one of internals - the only argument will be automata itself
	if (ReservedInternalFunctionNames.includes(FunctionName)) {
		return `(function() {
				const func = functionDictionary.get('${FunctionName}');
				return func(automata);
			})()`;
	}

	const argsList = Arguments.map((arg: DefineArgument) => {
		if (isDefineFunction(arg) || isNestedDefineFunction(arg)) {
			return getFunctionBody({
				expression: arg,
				expressions: props.expressions,
			});
		}
		return getExpressionValueDefine({
			expression: arg,
			expressions: props.expressions,
		});
	}).join(', ');

	return `(function() {
				const func = functionDictionary.get('${FunctionName}');
				return func(${argsList});
			})()`;
}

export function checkUserFunctionsDefined(props: {
	injectedPath: TNullable<string>;
	defines: DefineStatement[];
}) {
	const { injectedPath, defines } = props;
	const identifiers = defines.map(({ identifier }) => identifier);

	return `(function (){
		const defines = [${identifiers.join(',')}]
	  
		defines.forEach((identifier) => {
			if (!${DEFAULT_USER_FUNCTIONS_NAMESPACE}[identifier]) {
				throw new Error(\`Function \${identifier}\ is not defined in ${injectedPath}\`);
       }
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
	const defines = diagram.states.flatMap(state => state.notes ? getDefineStatements(state.notes) : []);
	const inject = diagram.states.flatMap(state => state.notes ? getInjectStatements(state.notes) : []);

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
			const { expression } = defineFunction;
			const functionBody = isDefineFunction(expression) || isNestedDefineFunction(expression)
				? getFunctionBody({ expression, expressions })
				: getExpressionValueDefine({ expression, expressions });
			newDictionary.push(`functionDictionary.register('${funcName}', function(${defineFunction.args.join(', ')}) {
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
