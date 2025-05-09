import { EmptyFileSystem } from 'langium';
import { parseHelper } from 'langium/test';
import { ExpressionTypes, maxNestedFuncLevel } from '../constants';
import {
	ArgumentReference,
	ArrayLiteral,
	KeyItem as AstKeyItem,
	Constant,
	ContextReference,
	ContextStatement,
	DataObject,
	DataObjectReference,
	DefineStatement,
	EmitStatement,
	Expression,
	FunctionCall,
	InjectStatement,
	isByPassStatement,
	isContextStatement,
	isDefineStatement,
	isEmitStatement,
	isExpressionStatement,
	isFunctionCall,
	isInitialStateStatement,
	isInjectStatement,
	isSubscribeStatement,
	Model,
	NumberLiteral,
	PayloadReference,
	RawKeyItem,
	StringLiteral,
	SubscribeStatement,
} from '../generated/ast';
import {
	TExpressionDefineMap,
	TExpressionMap,
	TInjectIdent,
	TRefereneceType,
} from '../types/expressions';
import {
	KeyItemType,
	TKeyItemBase,
	TKeyItemReducer,
	TKeyItemReducerOrExpression,
	TKeyItems,
	TKeyItemWithExpression,
} from '../types/keyItem';
import {
	TContextItem,
	TContextReducer,
	TContextShort,
	TDefine,
	TEmitFull,
	TEmitWithMeta,
	TEventEmit,
	TEventEmitStatement,
	TEventSubscribe,
	TNotes,
	TSubscribeStatement,
	TSubscribeWithMeta,
	TSubscribeWithPayload,
} from '../types/statements';
import { createYantrixServices } from '../yantrix-module';

export class YantrixLangiumParser {
	private services;

	constructor() {
		this.services = createYantrixServices({ fileSystemProvider: EmptyFileSystem.fileSystemProvider });
	}

	async parse(text: string): Promise<TNotes> {
		const doParse = parseHelper(this.services.yantrix);
		const { parseResult, diagnostics } = await doParse(text, { validation: true });
		const ast = parseResult.value as Model;

		const parseErrors = parseResult.parserErrors || [];
		const lexerErrors = parseResult.lexerErrors || [];

		if (diagnostics && diagnostics.length > 0) {
			throw diagnostics.pop();
		}

		if (parseErrors.length > 0 || lexerErrors.length > 0) {
			throw new Error(`Parsing errors: ${parseErrors.map(d => d.message).join(', ')}`);
		}

		return this.transformToYantrixFormat(ast);
	}

	private transformToYantrixFormat(ast: Model): TNotes {
		return {
			defines: this.transformDefines(ast),
			contextDescription: this.transformContextDescription(ast),
			emit: this.transformEmit(ast),
			subscribe: this.transformSubscribe(ast),
			initialState: this.hasInitialState(ast),
			byPass: this.hasByPass(ast),
			inject: this.transformInject(ast),
			expression: this.transformExpressionStatement(ast),
		};
	}

	private transformDefines(ast: Model): TDefine[] {
		return ast.statements
			.filter((stmt): stmt is DefineStatement => isDefineStatement(stmt))
			.map(stmt => ({
				identifier: stmt.identifier,
				Arguments: stmt.arguments || [],
				expression: this.transformExpression(stmt.function) as TExpressionDefineMap,
			}));
	}

	private transformContextDescription(ast: Model): TContextItem[] {
		return ast.statements
			.filter((stmt): stmt is ContextStatement => isContextStatement(stmt))
			.map((stmt) => {
				const contextKeyItems = this.transformKeyItems(stmt.keyItems);

				if (stmt.reducerItems && stmt.reducerItems.length > 0) {
					const reducerKeyItems = this.transformKeyItems<typeof KeyItemType.REDUCER>(
						stmt.reducerItems,
						true,
					);

					const result: TContextReducer = {
						context: contextKeyItems,
						reducer: reducerKeyItems,
					};

					return result;
				}

				const result: TContextShort = {
					context: contextKeyItems,
				};

				return result;
			});
	}

	private transformExpressionStatement(ast: Model) {
		const expressionStatements = ast.statements.filter(stmt => isExpressionStatement(stmt));
		if (expressionStatements.length === 0) {
			return;
		}

		const stmt = expressionStatements[0];
		return this.transformExpression(stmt?.expression) as TExpressionMap;
	}

	private transformEmit(ast: Model): TEventEmit[] {
		return ast.statements
			.filter((stmt): stmt is EmitStatement => isEmitStatement(stmt))
			.map((stmt) => {
				const baseEmit: TEventEmitStatement = {
					identifier: stmt.identifier,
				};

				if (stmt.metaItems?.length > 0 && stmt.contextItems?.length > 0) {
					const metaItems = this.transformKeyItems<typeof KeyItemType.REDUCER>(
						stmt.metaItems,
						true,
					);
					const contextItems = this.transformKeyItems<typeof KeyItemType.REDUCER>(
						stmt.contextItems,
						true,
					);

					const result: TEmitFull = {
						...baseEmit,
						meta: metaItems,
						context: contextItems,
					};

					return result;
				}

				if (stmt.metaItems?.length > 0) {
					const metaItems = this.transformKeyItems<typeof KeyItemType.REDUCER>(
						stmt.metaItems,
						true,
					);

					const result: TEmitWithMeta = {
						...baseEmit,
						meta: metaItems,
					};

					return result;
				}

				if (stmt.contextItems?.length > 0) {
					const contextItems = this.transformKeyItems<typeof KeyItemType.REDUCER>(
						stmt.contextItems,
						true,
					);

					return {
						...baseEmit,
						context: contextItems,
					} as TEventEmit;
				}

				return baseEmit;
			});
	}

	private transformSubscribe(ast: Model): TEventSubscribe[] {
		return ast.statements
			.filter((stmt): stmt is SubscribeStatement => isSubscribeStatement(stmt))
			.map((stmt) => {
				const baseSubscribe: TSubscribeStatement = {
					identifier: stmt.eventIdentifier,
					actionName: stmt.actionName,
				};

				if (stmt.payloadItems?.length > 0 && stmt.metaItems?.length > 0) {
					const payloadItems = this.transformKeyItems<typeof KeyItemType.REDUCER>(
						stmt.payloadItems,
						true,
					);
					const metaItems = this.transformKeyItems<typeof KeyItemType.REDUCER>(
						stmt.metaItems,
						true,
					);

					const result: TSubscribeWithMeta = {
						...baseSubscribe,
						payload: payloadItems,
						meta: metaItems,
					};

					return result;
				}

				if (stmt.payloadItems?.length > 0) {
					const payloadItems = this.transformKeyItems<typeof KeyItemType.REDUCER>(
						stmt.payloadItems,
						true,
					);

					const result: TSubscribeWithPayload = {
						...baseSubscribe,
						payload: payloadItems,
					};

					return result;
				}

				return baseSubscribe;
			});
	}

	private hasInitialState(ast: Model): boolean {
		return ast.statements.some(stmt =>
			isInitialStateStatement(stmt),
		);
	}

	private hasByPass(ast: Model): boolean {
		return ast.statements.some(stmt =>
			isByPassStatement(stmt),
		);
	}

	private transformInject(ast: Model): TInjectIdent[] {
		return ast.statements
			.filter((stmt): stmt is InjectStatement => isInjectStatement(stmt))
			.map(stmt => ({
				identifier: stmt.identifier,
			}));
	}

	private transformKeyItems<X extends (typeof KeyItemType)[keyof typeof KeyItemType] = typeof KeyItemType.RAW>(
		items: RawKeyItem[] | AstKeyItem[] | any[],
		isReducer: boolean = false,
	): TKeyItems<X> {
		return items.map((item) => {
			if (isReducer && (
				item.$type === NumberLiteral
				|| item.$type === StringLiteral
				|| item.$type === ArrayLiteral
				|| item.$type === FunctionCall
				|| item.$type === ContextReference
				|| item.$type === PayloadReference
				|| item.$type === ContextReference
			)) {
				return {
					keyItem: {
						expression: this.transformExpression(item),
					} as TKeyItemReducerOrExpression,
				};
			}

			return {
				keyItem: this.transformKeyItem(item, isReducer) as (
					X extends typeof KeyItemType.REDUCER
						? TKeyItemReducerOrExpression
						: TKeyItemWithExpression
				),
			};
		}) as TKeyItems<X>;
	}

	private transformKeyItem(
		item: RawKeyItem | AstKeyItem | any,
		isReducer: boolean = false,
	): TKeyItemWithExpression | TKeyItemReducerOrExpression {
		if (isFunctionCall(item)) {
			return {
				expression: this.transformExpression(item),
			};
		}

		if (isReducer) {
			if ('reference' in item && item.reference) {
				const expressionType = this.getReferenceType(item.reference);

				// Extract identifier from reference
				let identifier = '';
				if (item.reference.$type === ContextReference) {
					identifier = (item.reference as ContextReference).identifier;
				} else if (item.reference.$type === PayloadReference) {
					identifier = (item.reference as PayloadReference).identifier;
				} else if (item.reference.$type === Constant) {
					identifier = (item.reference as Constant).identifier;
				}

				const baseItem: TKeyItemReducer = {
					identifier,
					expressionType,
				};

				if ('expression' in item && item.expression) {
					return {
						...baseItem,
						expression: this.transformExpression(item.expression),
					};
				}

				return baseItem;
			}

			// For expressions without reference
			if ('expression' in item && item.expression) {
				return {
					expression: this.transformExpression(item.expression),
				};
			}

			// For RawKeyItem
			if ('identifier' in item) {
				return {
					identifier: item.identifier,
				} as TKeyItemWithExpression;
			}
			throw new Error(`Invalid item type: ${item.$type || 'unknown'}`);
		}

		// For raw key items
		const baseItem: TKeyItemBase = {
			identifier: 'identifier' in item ? item.identifier : '',
		};

		// If there's an expression
		if ('expression' in item && item.expression) {
			return {
				...baseItem,
				expression: this.transformExpression(item.expression),
			};
		}

		// If no expression, return baseItem
		return baseItem as TKeyItemWithExpression;
	}

	private getReferenceType(reference: DataObjectReference): TRefereneceType {
		switch (reference.$type) {
			case ContextReference:
				return ExpressionTypes.Context;
			case PayloadReference:
				return ExpressionTypes.Payload;
			case Constant:
				return ExpressionTypes.Constant;
			default:
				throw new Error(`Unknown reference type: ${reference.$type}`);
		}
	}

	private transformExpression(expr: Expression | undefined, nestingLevel: number = 0): TExpressionMap {
		if (!expr) throw new Error('Expression is undefined');

		if (nestingLevel > maxNestedFuncLevel) {
			throw new Error(`Function nesting level (${nestingLevel}) exceeds maximum allowed level (${maxNestedFuncLevel})`);
		}

		if (expr.inner) {
			return this.transformExpression(expr.inner, nestingLevel);
		}

		switch (expr.$type) {
			case StringLiteral:
				return {
					expressionType: ExpressionTypes.StringDeclaration,
					StringDeclaration: (expr as StringLiteral).value,
				};
			case NumberLiteral:
			{ const numLiteral = expr as NumberLiteral;
				const numValue = Number(numLiteral.value);
				return {
					expressionType: Number.isInteger(numValue)
						? ExpressionTypes.IntegerDeclaration
						: ExpressionTypes.DecimalDeclaration,
					NumberDeclaration: numValue,
				}; }
			case ArrayLiteral:
				return {
					expressionType: ExpressionTypes.ArrayDeclaration,
					ArrayDeclaration: [],
				};
			case FunctionCall:
			{ const funcCall = expr as FunctionCall;

				const functionName = funcCall.name.replace(/\($/, '');
				const nextNestingLevel = nestingLevel + 1;

				if (nextNestingLevel > maxNestedFuncLevel) {
					throw new Error(`Function nesting level (${nextNestingLevel}) exceeds maximum allowed level (${maxNestedFuncLevel})`);
				}

				const args = funcCall.arguments?.map((arg) => {
					if (arg.$type === FunctionCall) {
						return this.transformExpression(arg, nextNestingLevel);
					}
					return this.transformExpression(arg, nestingLevel);
				}) || [];

				return {
					expressionType: ExpressionTypes.Function,
					FunctionDeclaration: {
						FunctionName: functionName,
						Arguments: args,
					},
				}; }
			case ContextReference:
				return {
					expressionType: ExpressionTypes.Context,
					identifier: (expr as ContextReference).identifier,
				};
			case PayloadReference:
				return {
					expressionType: ExpressionTypes.Payload,
					identifier: (expr as PayloadReference).identifier,
				};
			case Constant:
				return {
					expressionType: ExpressionTypes.Constant,
					identifier: (expr as Constant).identifier,
				};
			case DataObject:
				if ('reference' in expr && expr.reference) {
					const reference = expr.reference as DataObjectReference;
					const expressionType = this.getReferenceType(reference);

					let identifier = '';
					if (reference.$type === ContextReference) {
						identifier = (reference as ContextReference).identifier;
					} else if (reference.$type === PayloadReference) {
						identifier = (reference as PayloadReference).identifier;
					} else if (reference.$type === Constant) {
						identifier = (reference as Constant).identifier;
					}

					const result = {
						expressionType,
						identifier,
					} as any;

					if ('expression' in expr && expr.expression) {
						result.expression = this.transformExpression(expr.expression as any, nestingLevel);
					}

					return result;
				}
				break;
			case ArgumentReference:
				return {
					expressionType: ExpressionTypes.Identifier as any,
					identifier: (expr as ArgumentReference).name,
				};
			default:
				throw new Error(`Unknown expression type: ${expr.$type}`);
		}

		throw new Error(`Unhandled expression: ${expr.$type}`);
	}
}
