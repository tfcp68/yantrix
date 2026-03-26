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
