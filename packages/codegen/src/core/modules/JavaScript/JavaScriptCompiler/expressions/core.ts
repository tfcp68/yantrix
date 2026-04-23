import { ArrayLiteral, Constant, DataObject, DefineArgument, DefineExpression, DefineFunction, Expression, FunctionCall, getNumberValue, getReferenceIdentifier, getReferenceType, getStringValue, isConstant, isDataObject, isFunctionCall, isIntegerLiteral, KeyItem, MAX_NESTED_FUNC_LEVEL, NestedDefineFunction, NumberLiteral, StringLiteral } from '@yantrix/yantrix-parser';
import { TConstants, TExpressionRecord } from '../../../../../types/common';
import { pathRecord } from '../../../../shared';
import { getFunctionBody } from './functions';
import { expressionsSerializer, mapInternals } from './serializer';

export function setupExpressions(props: {
	constants: TConstants | null;
}): TExpressionRecord {
	const expressionRecord: TExpressionRecord = {
		array: () => '[]',
		constant: (expr: DataObject) => {
			if (props.constants === null) {
				throw new Error('Missing dictionary with constants');
			}
			const identifier = getReferenceIdentifier(expr);

			if (props.constants[identifier] === undefined) {
				throw new Error(
					`The identifier is missing in the const dictionary: ${identifier}`,
				);
			}
			if (typeof props.constants[identifier] === 'string')
				return `"${props.constants[identifier]}"`;

			return `${props.constants[identifier]}`;
		},
		function: () => {
			return 'null';
		},
		decimal: (expr: NumberLiteral) => {
			return `${getNumberValue(expr)}`;
		},
		integer: (expr: NumberLiteral) => {
			return `${getNumberValue(expr)}`;
		},
		string: (expr: StringLiteral) => {
			return `'${getStringValue(expr)}'`;
		},
		context: (expr: DataObject) => {
			const identifier = getReferenceIdentifier(expr);
			return `prevContext === null ||  (prevContext === undefined || prevContext['${identifier}'] === undefined) ? null : prevContext['${identifier}']`;
		},
		payload: (expr: DataObject) => {
			const identifier = getReferenceIdentifier(expr);
			return `payload === null || (payload === undefined  || payload['${identifier}'] === undefined) ? null : payload['${identifier}']`;
		},
	};

	expressionRecord.function = (func: FunctionCall) => {
		let currentRecLevel = 0;
		const recursive = (func: FunctionCall): string => {
			const { name: FunctionName, args: Arguments } = func;

			const res: string[] = [];

			if (currentRecLevel < MAX_NESTED_FUNC_LEVEL) {
				Arguments.forEach((item: Expression) => {
					if (isDataObject(item)) {
						const refType = getReferenceType(item);
						const identifier = getReferenceIdentifier(item);
						const path = pathRecord[refType];

						if (!path) {
							throw new Error(`Unknown reference type: ${refType}`);
						}

						if (item.assignedExpression) {
							const expression = item.assignedExpression;

							if (isFunctionCall(expression)) {
								currentRecLevel++;
								res.push(recursive(expression));
							}

							const valueExpression = getExpressionValue({
								expressionRecord,
								expression,
							});

							res.push(
								`${expressionsSerializer.getDefaultPropertyContext(path, identifier, valueExpression)}`,
							);
						} else {
							if (isConstant(item.reference)) {
								const expressionValueRight = getExpressionValue({
									expressionRecord,
									expression: item,
								});
								res.push(expressionValueRight);
							} else {
								res.push(
									`${expressionsSerializer.getDefaultPropertyContext(path, identifier)}`,
								);
							}
						}
					} else if (isFunctionCall(item)) {
						res.push(recursive(item));
					} else {
						const valueExpression = getExpressionValue({
							expressionRecord,
							expression: item,
						});
						res.push(valueExpression);
					}
				});
			} else {
				throw new Error(
					`Max level of nested functions reached ${MAX_NESTED_FUNC_LEVEL}`,
				);
			}
			const internalRef = mapInternals(FunctionName);
			if (internalRef !== null) return internalRef;

			return expressionsSerializer.getFunctionFromDictionary(FunctionName).concat(
				`(${res.join(',')})`,
			);
		};

		const res = recursive(func);
		return res;
	};

	return expressionRecord;
}

const expressionHandlers = {
	FunctionCall: (expr: FunctionCall, record: TExpressionRecord) => record.function(expr),
	DataObject: (expr: DataObject, record: TExpressionRecord) => record[getReferenceType(expr)](expr),
	ArrayLiteral: (expr: ArrayLiteral, record: TExpressionRecord) => record.array(expr),
	StringLiteral: (expr: StringLiteral, record: TExpressionRecord) => record.string(expr),
	NumberLiteral: (expr: NumberLiteral, record: TExpressionRecord) =>
		isIntegerLiteral(expr) ? record.integer(expr) : record.decimal(expr),
};

export function getExpressionValue(props: {
	expressionRecord: TExpressionRecord;
	expression: Expression | KeyItem;
}): string {
	const { expression, expressionRecord } = props;
	const handler = expressionHandlers[expression.$type as keyof typeof expressionHandlers];

	if (!handler) {
		throw new Error(`Unknown expression type: ${expression.$type}`);
	}

	return handler(expression as never, expressionRecord);
}

const defineExpressionHandlers = {
	IdentifierRef: (expr: { identifier: string }) => expr.identifier,
	DefineFunction: (expr: DefineFunction, record: TExpressionRecord) =>
		getFunctionBody({ expression: expr, expressions: record }),
	NestedDefineFunction: (expr: NestedDefineFunction, record: TExpressionRecord) =>
		getFunctionBody({ expression: expr, expressions: record }),
	Constant: (expr: Constant, record: TExpressionRecord) =>
		record.constant({ $type: 'DataObject', reference: expr } as DataObject),
	ArrayLiteral: (expr: ArrayLiteral, record: TExpressionRecord) => record.array(expr),
	StringLiteral: (expr: StringLiteral, record: TExpressionRecord) => record.string(expr),
	NumberLiteral: (expr: NumberLiteral, record: TExpressionRecord) =>
		isIntegerLiteral(expr) ? record.integer(expr) : record.decimal(expr),
};

export function getExpressionValueDefine(props: {
	expressions: TExpressionRecord;
	expression: DefineArgument | DefineExpression;
}): string {
	const { expression, expressions } = props;
	const handler = defineExpressionHandlers[expression.$type as keyof typeof defineExpressionHandlers];

	if (!handler) {
		throw new Error(`Unknown define expression type: ${expression.$type}`);
	}

	return handler(expression as never, expressions);
}
