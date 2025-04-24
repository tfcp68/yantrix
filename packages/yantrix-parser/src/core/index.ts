import { EmptyFileSystem } from 'langium';
import { ExpressionTypes } from '../constants';
import {
	KeyItem as AstKeyItem,
	Constant,
	ContextReference,
	ContextStatement,
	DataObjectReference,
	DefineStatement,
	EmitStatement,
	Expression,
	FunctionCall,
	InjectStatement,
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

	parse(text: string): TNotes {
		const document = this.services.yantrix.parser.LangiumParser.parse(text);

		const ast = document.value as Model;
		const diagnostics = document.parserErrors || [];
		const lexerErrors = document.lexerErrors || [];

		if (diagnostics.length > 0 || lexerErrors.length > 0) {
			throw new Error(`Parsing errors: ${diagnostics.map(d => d.message).join(', ')}`);
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
			.filter((stmt): stmt is DefineStatement => stmt.$type === 'DefineStatement')
			.map(stmt => ({
				identifier: stmt.identifier,
				Arguments: stmt.arguments || [],
				expression: this.transformExpression(stmt.function) as TExpressionDefineMap,
			}));
	}

	private transformContextDescription(ast: Model): TContextItem[] {
		return ast.statements
			.filter((stmt): stmt is ContextStatement => stmt.$type === 'ContextStatement')
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
		const res = ast.statements.filter(stmt => stmt.$type === 'ExpressionStatement').map((stmt) => {
			return this.transformExpression(stmt.expression) as TExpressionMap;
		})[0];

		return res;
	}

	private transformEmit(ast: Model): TEventEmit[] {
		return ast.statements
			.filter((stmt): stmt is EmitStatement => stmt.$type === 'EmitStatement')
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

				// If we only have meta items
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
			.filter((stmt): stmt is SubscribeStatement => stmt.$type === 'SubscribeStatement')
			.map((stmt) => {
				const baseSubscribe: TSubscribeStatement = {
					identifier: stmt.eventIdentifier,
					actionName: stmt.actionName,
				};

				// If we have both payload and meta items
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

				// If we only have payload items
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
		return ast.statements.some((stmt) => {
			return stmt.$type === 'InitialStateStatement';
		});
	}

	private hasByPass(ast: Model): boolean {
		return ast.statements.some(stmt =>
			stmt.$type === 'ByPassStatement',
		);
	}

	private transformInject(ast: Model): TInjectIdent[] {
		return ast.statements
			.filter((stmt): stmt is InjectStatement => stmt.$type === 'InjectStatement')
			.map(stmt => ({
				identifier: stmt.identifier,
			}));
	}

	private transformKeyItems<X extends (typeof KeyItemType)[keyof typeof KeyItemType] = typeof KeyItemType.RAW>(
		items: RawKeyItem[] | AstKeyItem[],
        isReducer: boolean = false,
	): TKeyItems<X> {
		return items.map(item => ({
			keyItem: this.transformKeyItem(item, isReducer) as (
				X extends typeof KeyItemType.REDUCER
					? TKeyItemReducerOrExpression
					: TKeyItemWithExpression
			),
		})) as TKeyItems<X>;
	}

	private transformKeyItem(
		item: RawKeyItem | AstKeyItem,
        isReducer: boolean = false,
	): TKeyItemWithExpression | TKeyItemReducerOrExpression {
		if (isReducer) {
			// For DataObject with reference (context, payload, constant)
			if ('reference' in item && item.reference) {
				const expressionType = this.getReferenceType(item.reference);
				const baseItem: TKeyItemBase = {
					identifier: 'identifier' in item ? item.identifier as string : '',
				};

				// If it has an expression
				if ('expression' in item && item.expression) {
					const result: TKeyItemReducer = {
						...baseItem,
						expressionType,
						expression: this.transformExpression(item.expression),
					};
					return result;
				}

				// If it doesn't have an expression
				const result: TKeyItemReducer = {
					...baseItem,
					expressionType,
				};
				return result;
			}

			// For FunctionCall or other expressions without reference
			if ('expression' in item && item.expression) {
				return {
					expression: this.transformExpression(item.expression),
				};
			}
		}

		// For raw key items
		const baseItem: TKeyItemBase = {
			identifier: 'identifier' in item ? item.identifier : '',
		};

		// If it has an expression
		if ('expression' in item && item.expression) {
			const result: TKeyItemWithExpression = {
				...baseItem,
				expression: this.transformExpression(item.expression),
			};
			return result;
		}

		throw new Error('Unknown key item type');
	}

	private getReferenceType(reference: DataObjectReference): TRefereneceType {
		switch (reference.$type) {
			case 'ContextReference':
				return ExpressionTypes.Context;
			case 'PayloadReference':
				return ExpressionTypes.Payload;
			case 'Constant':
				return ExpressionTypes.Constant;
			default:
				throw new Error(`Unknown reference type: ${reference.$type}`);
		}
	}

	private transformExpression(expr: Expression | undefined): TExpressionMap {
		if (!expr) return null as any;

		switch (expr.$type) {
			case 'StringLiteral':
				return {
					expressionType: ExpressionTypes.StringDeclaration,
					StringDeclaration: (expr as StringLiteral).value,
				};
			case 'NumberLiteral':
				return {
					expressionType: ExpressionTypes.IntegerDeclaration,
					NumberDeclaration: Number((expr as NumberLiteral).value),
				};
			case 'ArrayLiteral':
				return {
					expressionType: ExpressionTypes.ArrayDeclaration,
					ArrayDeclaration: [],
				};
			case 'FunctionCall':
				return {
					expressionType: ExpressionTypes.Function,
					FunctionDeclaration: {
						FunctionName: (expr as FunctionCall).name,
						Arguments: (expr as FunctionCall).arguments.map(arg => this.transformExpression(arg)),
					},
				};
			case 'ContextReference':
				return {
					expressionType: ExpressionTypes.Context,
					identifier: (expr as ContextReference).identifier,
				};
			case 'PayloadReference':
				return {
					expressionType: ExpressionTypes.Payload,
					identifier: (expr as PayloadReference).identifier,
				};
			case 'Constant':
				return {
					expressionType: ExpressionTypes.Constant,
					identifier: (expr as Constant).identifier,
				};
			default:
				console.warn(`Unknown expression type: ${expr.$type}`);
				return null as any;
		}
	}
}
