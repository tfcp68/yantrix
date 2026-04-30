import { builtInFunctions } from '@yantrix/functions';
import { TNullable } from '@yantrix/utils';
import {
	DefineExpression,
	defineExpressionIsFunction,
	getDefineStatements,
	getInjectStatements,
	InjectStatement,
} from '@yantrix/yantrix-parser';
import { TExpressionRecord, TStateDiagramMatrixIncludeNotes, TUserFunctionsDict } from '../../../../../types/common';
import { getExpressionValueDefine } from '../expressions/core';
import { getFunctionBodyModel, TDefineExpressionModel } from '../expressions/functions';
import { TDependencyGraph } from '../imports';
import { TCustomRegistration } from './types';

export function getFunctionBody(props: {
	expressions: TExpressionRecord;
	expression: DefineExpression;
}): TDefineExpressionModel {
	if (defineExpressionIsFunction(props.expression)) {
		return getFunctionBodyModel({
			expression: props.expression,
			expressions: props.expressions,
		});
	} else {
		return {
			kind: 'raw',
			value: getExpressionValueDefine({
				expression: props.expression,
				expressions: props.expressions,
			}),
		};
	}
}

export function getUserFunctionsCheckModel(props: {
	injectedPath: TNullable<string>;
	injects: InjectStatement[];
}) {
	const { injectedPath, injects } = props;
	if (!injectedPath && injects.length > 0) {
		throw new TypeError('Function identifier is defined in the diagram but no inject file is provided');
	}

	return {
		hasInjectedPath: Boolean(injectedPath),
		injectIdentifiers: injects.map(inject => inject.identifier),
	};
}

export function getCustomFunctionRegistrationsModel(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	dependencyGraph: TDependencyGraph;
	expressions: TExpressionRecord;
	injectFunctions: TUserFunctionsDict;
}): TCustomRegistration[] {
	const { diagram, injectFunctions, dependencyGraph, expressions } = props;
	const defines = diagram.states.flatMap(state => state.notes ? getDefineStatements(state.notes) : []);
	const inject = diagram.states.flatMap(state => state.notes ? getInjectStatements(state.notes) : []);

	const registrations: TCustomRegistration[] = [];
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
			registrations.push({ kind: 'inject', name: funcName });
			registered.add(funcName);
		} else if (defineFunction) {
			const bodyModel = getFunctionBody({
				expression: defineFunction.expression,
				expressions,
			});
			registrations.push({ kind: 'define', name: funcName, args: defineFunction.args, bodyModel });
			registered.add(funcName);
		};
	};

	for (const funcName of dependencyGraph.keys()) {
		if (!registered.has(funcName)) {
			registerFunction(funcName);
		}
	}

	return registrations;
}

export function getCustomFunctionRegistrationsVM(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	dependencyGraph: TDependencyGraph;
	expressions: TExpressionRecord;
	injectFunctions: TUserFunctionsDict;
}): TCustomRegistration[] {
	return getCustomFunctionRegistrationsModel(props);
}
