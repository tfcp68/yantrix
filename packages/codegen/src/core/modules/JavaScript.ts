import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import type { TDiagramAction } from '@yantrix/mermaid-parser';
import { StartState } from '@yantrix/mermaid-parser';
import type {
	TContextItem,
	TExpressionFunction,
} from '@yantrix/yantrix-parser';
import {
	ExpressionTypes,
	isContextWithReducer,
	isKeyItemReference,
	isKeyItemWithExpression,
} from '@yantrix/yantrix-parser';
import type {
	ICodegen,
	TExpressionRecord,
	TGetCodeOptionsMap,
	TStateDiagramMatrixIncludeNotes,
} from '../../types/common.js';
import { fillDictionaries, pathRecord } from '../shared.js';
import type { ModuleNames } from './index';

// import Built_In_Functions from '../../builtins/JavaScript';

function getReferenceString(path: string, identifier: string): string {
	return `${path}['${identifier}']`;
}

function getFunctionFromDictionary(name: string): string {
	return `functionDictionary.get("${name}")`;
}

export const Expressions: TExpressionRecord = {
	[ExpressionTypes.ArrayDeclaration]: () => '[]',
	[ExpressionTypes.Function]: (func) => {
		const recursive = (func: TExpressionFunction & { root?: true }) => {
			const { FunctionDeclaration } = func;
			const { FunctionName, Arguments } = FunctionDeclaration;

			const res: string[] = [];

			if (Arguments.length !== 0) {
				Arguments.forEach((item) => {
					if (isKeyItemReference(item)) {
						const { expressionType, identifier } = item;
						const path = pathRecord[expressionType];

						if (isKeyItemWithExpression(item)) {
							const { expression } = item;

							if (expression.expressionType === ExpressionTypes.Function) {
								// @ts-expect-error invalid type
								res.push(recursive(expression));
							}
							// @ts-expect-error invalid type
							const valueExpression = Expressions[expression.expressionType](expression);

							res.push(`${getDefaultPropertyContext(path, identifier, valueExpression)}`);
						}
						else {
							res.push(`${getDefaultPropertyContext(path, identifier)}`);
						}
					}
					else {
						if (item.expressionType === ExpressionTypes.Function) {
							// @ts-expect-error invalid type
							res.push(recursive(item));
						}
						else {
							// @ts-expect-error invalid type
							const valueExpression = Expressions[item.expressionType](item);
							res.push(valueExpression);
						}
					}
				});
			}
			else {
				res.push(FunctionName);
			}

			return getFunctionFromDictionary(FunctionName).concat(`(${res.join(',')})`);
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
		return `'prevContext['${identifier}']'`;
	},
	[ExpressionTypes.Payload]: ({ identifier }) => {
		return `'payload['${identifier}']'`;
	},
} as const;

function getDefaultPropertyContext(path: string, indetifier: string, expression?: string): string {
	const fullPath = getReferenceString(path, indetifier);

	return `(function(){
						if(${fullPath} !== undefined && ${fullPath} !== null) {
							return ${path}['${indetifier}']
						}
							else {
								return ${expression || 'null'}
							}
					}())`;
}

export class JavaScriptCodegen implements ICodegen<ModuleNames.JavaScript> {
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
	// functionDictionary: FunctionDictionary;
	diagram: TStateDiagramMatrixIncludeNotes;
	handlersDict: string[];
	// initialContext: string;
	initialContextKeys: string[];
	changeStateHandlers: string[];
	dictionaries: string[];
	protected imports = {
		'@yantrix/automata': ['GenericAutomata', 'FunctionDictionary'],
		'@yantrix/codegen': ['builtInFunctions'],
	};

	constructor(diagram: TStateDiagramMatrixIncludeNotes) {
		this.actionDictionary = new BasicActionDictionary();
		this.stateDictionary = new BasicStateDictionary();
		// this.functionDictionary = new FunctionDictionary(Built_In_Functions); // + new functions from diagram
		this.diagram = diagram;

		this.handlersDict = [];
		this.changeStateHandlers = [];
		this.dictionaries = [];
		this.initialContextKeys = [];

		fillDictionaries(diagram, this.stateDictionary, this.actionDictionary);
		this.setupDictionaries();
	}

	public getImports(): string {
		let imports = '';
		for (const [key, value] of Object.entries(this.imports)) {
			imports += `import { ${value.join(', ')} } from '${key}';\n`;
		}
		return imports;
	}

	public getDictionaries(): string {
		return this.dictionaries.join('\n');
	}

	setupDictionaries(): void {
		this.dictionaries.push(
			`export const statesDictionary = ${JSON.stringify(this.stateDictionary.getDictionary(), null, 2)}`,
		);
		this.dictionaries.push(
			`export const actionsDictionary = ${JSON.stringify(this.actionDictionary.getDictionary(), null, 2)}`,
		);
		this.dictionaries.push(`export const functionDictionary = new FunctionDictionary(builtInFunctions)`);
	}

	getClassTemplate(className: string): string {
		return `export class ${className} extends GenericAutomata {
  		 constructor() {
  			super();
  			this.init({
  				state: ${this.getInitialState()},
  				context:null,
                rootReducer: ${this.getRootReducer()},
  				stateValidator: ${this.getStateValidator()},
  				actionValidator: ${this.getActionValidator()},
				});
			}
			isKeyOf = ${this.getIsKeyOf()};
			static id = '${className}';
			static actions = actionsMap;
			static states = statesMap;
			static getState = ${this.getGetStateFunc()};
			static hasState = ${this.getHasStateFunc(className)};
			static getAction = ${this.getGetActionFunc()};
			static createAction = ${this.getCreateActionFunc(className)};
		}
		export default ${className};
		`;
	}

	protected getHasStateFunc(className: string): string {
		return `(instance, state) => instance.state === ${className}.getState(state)`;
	}

	protected getGetStateFunc(): string {
		return `(state) => statesDictionary[state]`;
	}

	public getCode(options: TGetCodeOptionsMap[ModuleNames.JavaScript]): string {
		return `
			${this.getImports()}
			${this.getDictionaries()}
			const actionsMap = ${JSON.stringify(this.getActionsMap(), null, 2)}
			const statesMap = ${JSON.stringify(this.getStatesMap(), null, 2)}
			${this.getDefaultContext()}
			${this.getActionToStateFromState()}
			${this.getClassTemplate(options.className)}
		`;
	}

	getObjectKeysMap(dict: Record<any, any>): Record<string, string> {
		const obj: Record<string, string> = {};
		Object.keys(dict).forEach((key: string) => {
			obj[key] = key;
		});
		return obj;
	}

	getActionsMap(): Record<string, string> {
		return this.getObjectKeysMap(this.actionDictionary.getDictionary());
	}

	getStatesMap(): Record<string, string> {
		return this.getObjectKeysMap(this.stateDictionary.getDictionary());
	}

	protected getGetActionFunc(): string {
		return `(action) => actionsDictionary[action];`;
	}

	protected getCreateActionFunc(className: string): string {
		return `
		(action, payload) => {
			const actionId = ${className}.getAction(action);
			return {
				action: actionId,
				payload,
			}
		}`;
	}

	public getActionToStateFromState(): string {
		return `const actionToStateFromStateDict = {${this.getActionToStateFromStateDict().join('\n\t')}}`;
	}

	getActionToStateDict(transitions: Record<string, TDiagramAction>): string[] {
		return Object.entries(transitions)
			.map(([key, transition]) => {
				const newState = this.stateDictionary.getStateValues({ keys: [key] })[0];
				return transition.actionsPath.map(({ action }) => {
					const actionValue = this.actionDictionary.getActionValues({
						keys: action,
					})[0];
					if (!actionValue)
						throw new Error(`Action ${action} not found`);
					if (!newState)
						throw new Error(`State ${key} not found`);

					const newCtx = this.getContextTransition(key);
					// const ctx = this.getSubsyntaxContext(key);

					return `
				  ${actionValue}: {
				  	state: ${newState},
				  	getNewContext: ({payload, context:prevContext}) => {
				  			return ${newCtx};
				  	}
				  },
				`;
				});
			})
			.flatMap(el => `${el.join('\n\t')}`);
	}

	protected getIsKeyOf(): string {
		return `(key, obj) => key in obj`;
	}

	protected getRootReducer(): string {
		return `({ action, context, payload, state }) => {
					if (!action || payload === null) return { state, context };
					${this.getRootReducerStateValidation()}
					${this.getRootReducerActionValidation()}
					const {state:newState,getNewContext} = actionToStateFromStateDict[state][action]


					return {state:newState, context: getNewContext({payload,context})};
  				}`;
	}

	protected getRootReducerStateValidation(): string {
		return `${this.getRootReducerStateValidationHead()} ${this.getRootReducerStateValidationError()}`;
	}

	protected getRootReducerStateValidationHead(): string {
		return `if (!this.isKeyOf(state, actionToStateFromStateDict))`;
	}

	protected getRootReducerStateValidationError(): string {
		return `throw new Error("Invalid state, maybe machine isn't running.")`;
	}

	protected getRootReducerActionValidation(): string {
		return `if (!this.isKeyOf(action, actionToStateFromStateDict[state])) return { state, context };`;
	}

	protected getStateValidator(): string {
		return `(s) => Object.values(statesDictionary).includes(s)`;
	}

	protected getActionValidator(): string {
		return `(a) => Object.values(actionsDictionary).includes(a)`;
	}

	protected getActionToStateFromStateDict(): string[] {
		return Object.entries(this.diagram.transitions).map(([state, transitions]) => {
			const value = this.stateDictionary.getStateValues({ keys: [state] })[0];
			if (!value)
				throw new Error(`State ${state} not found`);

			return `${value}: {${this.getActionToStateDict(transitions).join('\n\t')}},`;
		});
	}

	protected getContextTransition(state: string): string {
		const value = this.diagram.states.find((diagramState) => {
			return diagramState.id === state;
		});

		if (!value) {
			throw new Error(`Invalid state - ${value}`);
		}

		const ctxRes: string[] = [];

		value.notes?.contextDescription.forEach((ctx) => {
			const newContext = this.getContextItem(ctx);

			ctxRes.push(...newContext);
		});

		if (ctxRes.length === 0)
			return 'null';

		return `{${ctxRes.join(',\n\t')}}`;
	}

	public getDefaultContext(): string {
		return `const getDefaultContext = ({payload,context:prevContext}) => {
			// const initialContext = $//{this.getSubsyntaxContext(StartState)}
			return prevContext
		}`;
	}

	private getInitialState(): number | null | undefined {
		return this.stateDictionary.getStateValues({ keys: [StartState] })[0];
	}

	private getContextItem(ctx: TContextItem): string[] {
		if (isContextWithReducer(ctx)) {
			const { context, reducer } = ctx;

			return reducer
				.map(({ keyItem }) => {
					if (isKeyItemReference(keyItem)) {
						const { expressionType, identifier: boundIdentifier } = keyItem;
						const path = pathRecord[expressionType];

						if (isKeyItemWithExpression(keyItem)) {
							const { expression } = keyItem;

							// @ts-expect-error invalid type
							const expressionValueRight = Expressions[expression.expressionType](expression);

							return getDefaultPropertyContext(path, boundIdentifier, expressionValueRight);
						}
						else {
							return getDefaultPropertyContext(path, boundIdentifier);
						}
					}
					else {
						const { expression } = keyItem;

						// @ts-expect-error invalid type
						const expressionValueRight = Expressions[expression.expressionType](expression);
						return `(function(){
						return ${expressionValueRight}
					}())`;
					}
				})
				.map((el, index) => {
					const item = context[index];
					if (!item) {
						throw new Error('Unexcpeted index bound property');
					}
					const { keyItem } = item;
					const { identifier: targetProperty } = keyItem;

					if (isKeyItemWithExpression(keyItem)) {
						const { expression } = keyItem;

						// @ts-expect-error invalid type
						const expressionValueRight = Expressions[expression.expressionType](expression);

						return `${targetProperty}: (function(){
						const boundValue = ${el}
						if(boundValue !== null){
							return boundValue
						}
						else {
							return ${expressionValueRight}
						}

					}())`;
					}
					else {
						return `${targetProperty}: (function(){
						const boundValue = ${el}

						if(boundValue !== null) {
							return boundValue
						}
						return null

					}())`;
					}
				});
		}
		else {
			const { context } = ctx;
			return context.map(({ keyItem }) => {
				const { identifier } = keyItem;
				if (isKeyItemWithExpression(keyItem)) {
					const expressionValue = Expressions[keyItem.expression.expressionType](
						// @ts-expect-error invalid type
						keyItem.expression,
					);
					return getDefaultPropertyContext('prevContext', identifier, expressionValue);
				}
				else {
					return getDefaultPropertyContext('prevContext', identifier);
				}
			});
		}
	}
}
