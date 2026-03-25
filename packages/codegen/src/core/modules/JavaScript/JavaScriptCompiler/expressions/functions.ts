import { ReservedInternalFunctionNames } from '@yantrix/functions';
import {
	DefineArgument,
	DefineFunction,
	isDefineFunction,
	isNestedDefineFunction,
	NestedDefineFunction,
} from '@yantrix/yantrix-parser';
import { TExpressionRecord } from '../../../../../types/common';
import { getExpressionValueDefine } from './core';

export type TDefineExpressionModel =
	| { kind: 'raw'; value: string }
	| {
		kind: 'functionCall';
		functionName: string;
		isInternal: boolean;
		args: TDefineExpressionModel[];
	};

export function getFunctionBodyModel(props: {
	expressions: TExpressionRecord;
	expression: DefineFunction | NestedDefineFunction;
}): TDefineExpressionModel {
	const { name: functionName, args: argsList } = props.expression;

	if (ReservedInternalFunctionNames.includes(functionName)) {
		return {
			kind: 'functionCall',
			functionName,
			isInternal: true,
			args: [],
		};
	}

	const args = argsList.map((arg: DefineArgument): TDefineExpressionModel => {
		if (isDefineFunction(arg) || isNestedDefineFunction(arg)) {
			return getFunctionBodyModel({
				expression: arg,
				expressions: props.expressions,
			});
		}

		return {
			kind: 'raw',
			value: getExpressionValueDefine({
				expression: arg,
				expressions: props.expressions,
			}),
		};
	});

	return {
		kind: 'functionCall',
		functionName,
		isInternal: false,
		args,
	};
}

export function getFunctionBody(props: {
	expressions: TExpressionRecord;
	expression: DefineFunction | NestedDefineFunction;
}): string {
	const model = getFunctionBodyModel(props);
	const stringify = (node: TDefineExpressionModel): string => {
		if (node.kind === 'raw') {
			return node.value;
		}

		if (node.isInternal) {
			return `(function() {
				const func = functionDictionary.get('${node.functionName}');
				return func(automata);
			})()`;
		}

		const args = node.args.map(stringify).join(', ');
		return `(function() {
				const func = functionDictionary.get('${node.functionName}');
				return func(${args});
			})()`;
	};

	return stringify(model);
}
