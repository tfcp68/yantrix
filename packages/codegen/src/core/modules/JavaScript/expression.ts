import {
	ExpressionTypes,
	isKeyItemReference,
	isKeyItemWithExpression,
	maxNestedFuncLevel,
	TExpression,
	TExpressionDefineMap,
	TExpressionFunction,
	TMappedKeys,
} from '@yantrix/yantrix-parser';
import { TConstants, TExpressionRecord } from '../../../types/common';
import { pathRecord } from '../../shared';
import { getDefaultPropertyContext } from './getDefaultPropertyContext';
import { getFunctionFromDictionary } from './shorties';

export function getExpressionValue<T extends TMappedKeys>(props: {
	expressions: TExpressionRecord;
	expression: TExpression<T>;
}) {
	return props.expressions[props.expression.expressionType](props.expression);
}

export function getExpressionValueDefine(props: {
	expressions: TExpressionRecord;
	expression: TExpressionDefineMap;
}) {
	switch (props.expression.expressionType) {
		case ExpressionTypes.Identifier:
			return props.expression.identifier;
		case ExpressionTypes.Function:
			return getFunctionBody({
				expression: props.expression,
				expressions: props.expressions,
			});
		default:
			return getExpressionValue({
				expressions: props.expressions,
				expression: props.expression,
			});
	}
}

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
					expression: props.expression,
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

export function setupExpressions(props: {
	constants: TConstants;
	expressions: TExpressionRecord;
}): TExpressionRecord {
	return {
		[ExpressionTypes.ArrayDeclaration]: () => '[]',
		[ExpressionTypes.Constant]: ({ identifier }) => {
			// if (props.constants === null) {
			// 	throw new Error('Missing dictionary with constants');
			// }

			if (props.constants[identifier] === undefined) {
				throw new Error(
					`The identifier is missing in the const dictionary: ${identifier}`,
				);
			}
			if (typeof props.constants[identifier] === 'string')
				return `"${props.constants[identifier]}"`;

			return `${props.constants[identifier]}`;
		},
		[ExpressionTypes.Function]: (func) => {
			let currentRecLevel = 0;
			const recursive = (func: TExpressionFunction) => {
				const { FunctionDeclaration } = func;
				const { FunctionName, Arguments } = FunctionDeclaration;

				const res: string[] = [];

				if (currentRecLevel < maxNestedFuncLevel) {
					Arguments.forEach((item) => {
						if (isKeyItemReference(item)) {
							const { expressionType, identifier } = item;
							const path = pathRecord[expressionType];
							if (isKeyItemWithExpression(item)) {
								const { expression } = item;

								if (
									expression.expressionType
									=== ExpressionTypes.Function
								) {
									currentRecLevel++;
									res.push(recursive(expression));
								}

								const valueExpression
									= getExpressionValue({
										expressions: props.expressions,
										expression,
									});

								res.push(
									`${getDefaultPropertyContext(path, identifier, valueExpression)}`,
								);
							} else {
								if (
									item.expressionType
									=== ExpressionTypes.Constant
								) {
									const expressionValueRight
										= getExpressionValue({
											expressions: props.expressions,
											expression: item,
										});
									res.push(expressionValueRight);
								} else {
									res.push(
										`${getDefaultPropertyContext(path, identifier)}`,
									);
								}
							}
						} else {
							if (
								item.expressionType === ExpressionTypes.Function
							) {
								res.push(recursive(item));
							} else {
								const valueExpression
									= getExpressionValue({
										expressions: props.expressions,
										expression: item,
									});
								res.push(valueExpression);
							}
						}
					});
				} else {
					throw new Error(
						`Max level of nested functions reached ${maxNestedFuncLevel}`,
					);
				}

				return getFunctionFromDictionary(FunctionName).concat(
					`(${res.join(',')})`,
				);
			};

			const res = recursive(func);
			return res;
		},
		[ExpressionTypes.DecimalDeclaration]: ({ NumberDeclaration }) => {
			return `${NumberDeclaration}`;
		},
		[ExpressionTypes.IntegerDeclaration]: ({ NumberDeclaration }) => {
			return `${NumberDeclaration}`;
		},
		[ExpressionTypes.StringDeclaration]: ({ StringDeclaration }) => {
			return `'${StringDeclaration}'`;
		},
		[ExpressionTypes.Context]: ({ identifier }) => {
			return `prevContext === null ||  (prevContext === undefined || prevContext['${identifier}'] === undefined) ? null : prevContext['${identifier}']`;
		},
		[ExpressionTypes.Payload]: ({ identifier }) => {
			return `payload === null || (payload === undefined  || payload['${identifier}'] === undefined) ? null : payload['${identifier}']`;
		},
	} as const;
}
