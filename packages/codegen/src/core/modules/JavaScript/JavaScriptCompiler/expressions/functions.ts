import { ExpressionTypes, TExpressionDefineMap } from '@yantrix/yantrix-parser';
import { TExpressionRecord, TStateDiagramMatrixIncludeNotes } from '../../../../../types/common';
import { TDictionaries } from '../dictionaries';
import { TDependencyGraph } from '../imports';
import { getExpressionValueDefine } from './core';
import { ReservedInternalFunctionNames } from '@yantrix/functions';

export function getFunctionBody(props: {
	expressions: TExpressionRecord;
	expression: TExpressionDefineMap;
}): string {
	if (props.expression.expressionType === ExpressionTypes.Function) {
		const { FunctionName, Arguments } = props.expression.FunctionDeclaration;

		// If function name is one of internals - the only argument will be automata itself
		if (ReservedInternalFunctionNames.includes(FunctionName)) {
			return `(function() {
				const func = functionDictionary.get('${FunctionName}');
				return func(automata);
			})()`;
		}

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

export function registerCustomFunction(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	dependencyGraph: TDependencyGraph;
	dictionaries: TDictionaries;
	expressions: TExpressionRecord;
}) {
	const defines = props.diagram.states.flatMap(state => state.notes?.defines ?? []);
	const registered = new Set<string>();

	const registerFunction = (funcName: string) => {
		if (registered.has(funcName)) return;

		const funcDef = defines.find(def => def.identifier === funcName);
		if (!funcDef) return;

		const dependencies = props.dependencyGraph.get(funcName) || new Set();
		for (const dep of dependencies) {
			if (!registered.has(dep)) {
				registerFunction(dep);
			}
		}

		const functionBody = getFunctionBody({
			expressions: props.expressions,
			expression: funcDef.expression,

		});
		props.dictionaries.push(`functionDictionary.register('${funcName}', function(${funcDef.Arguments.join(', ')}) {
				return ${functionBody};
			});`);
		registered.add(funcName);
	};

	for (const funcName of props.dependencyGraph.keys()) {
		if (!registered.has(funcName)) {
			registerFunction(funcName);
		}
	}
}

export function registerCustomFunctions(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	dependencyGraph: TDependencyGraph;
	dictionaries: TDictionaries;
	expressions: TExpressionRecord;
}) {
	const newDictionary = props.dictionaries;
	const defines = props.diagram.states.flatMap(state => state.notes?.defines ?? []);
	const registered = new Set<string>();

	const registerFunction = (funcName: string) => {
		if (registered.has(funcName)) return;

		const funcDef = defines.find(def => def.identifier === funcName);
		if (!funcDef) return;

		const dependencies = props.dependencyGraph.get(funcName) || new Set();
		for (const dep of dependencies) {
			if (!registered.has(dep)) {
				registerFunction(dep);
			}
		}

		const functionBody = getFunctionBody({
			expression: funcDef.expression,
			expressions: props.expressions,
		});
		newDictionary.push(`functionDictionary.register('${funcName}', function(${funcDef.Arguments.join(', ')}) {
				return ${functionBody};
			});`);
		registered.add(funcName);
	};

	for (const funcName of props.dependencyGraph.keys()) {
		if (!registered.has(funcName)) {
			registerFunction(funcName);
		}
	}

	return newDictionary;
}
