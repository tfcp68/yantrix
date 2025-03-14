import { builtInFunctions } from '@yantrix/functions';
import { ExpressionTypes, TExpressionDefineMap } from '@yantrix/yantrix-parser';
import { TExpressionRecord, TStateDiagramMatrixIncludeNotes, TUserFunctionsDict } from '../../../../../types/common';
import { TDictionaries } from '../dictionaries';
import { TDependencyGraph } from '../imports';
import { getExpressionValueDefine } from './core';

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

export function registerCustomFunctions(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	dependencyGraph: TDependencyGraph;
	dictionaries: TDictionaries;
	expressions: TExpressionRecord;
	injectFunctions: TUserFunctionsDict;
}) {
	const newDictionary = props.dictionaries;
	const defines = props.diagram.states.flatMap(state => state.notes?.defines ?? []);
	const inject = props.diagram.states.flatMap(state => state.notes?.inject ?? []);

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
		if (injectFunction && !props.injectFunctions) {
			throw new TypeError(`Function identifier ${funcName} is defined in the diagram but no inject file is provided`);
		}

		const dependencies = props.dependencyGraph.get(funcName) || new Set();

		for (const dep of dependencies) {
			if (!registered.has(dep)) {
				registerFunction(dep, depth + 1);
			}
		}
		if (props.injectFunctions) {
			const userFunction = props.injectFunctions[funcName];
			if (!userFunction) {
				throw new TypeError(`Function identifier ${funcName} is defined in the diagram but no inject function is provided`);
			}
			newDictionary.push(`functionDictionary.register('${funcName}', ${userFunction});`);
			registered.add(funcName);
		} else if (defineFunction) {
			const functionBody = getFunctionBody({
				expression: defineFunction.expression,
				expressions: props.expressions,
			});
			newDictionary.push(`functionDictionary.register('${funcName}', function(${defineFunction.Arguments.join(', ')}) {
					return ${functionBody};
				});`);
			registered.add(funcName);
		};
	};

	for (const funcName of props.dependencyGraph.keys()) {
		if (!registered.has(funcName)) {
			registerFunction(funcName);
		}
	}

	return newDictionary;
}
