import { TConstants, TExpressionRecord } from './../../types/common';
import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import { StartState, TDiagramAction } from '@yantrix/mermaid-parser';
import { ICodegen, TModuleParams, TStateDiagramMatrixIncludeNotes } from '../../types/common.js';
import { fillDictionaries, pathRecord } from '../shared.js';
import {
	TContextItem,
	isContextWithReducer,
	isKeyItemWithExpression,
	ExpressionTypes,
	isKeyItemReference,
	TExpressionFunction,
	TExpression,
	TMapped,
	maxNestedFuncLevel,
} from '@yantrix/yantrix-parser';

const getReferenceString = (path: string, identifier: string) => {
	return `${path}['${identifier}']`;
};

const getFunctionFromDictionary = (name: string) => {
	return `functionDictionary['${name}']`;
};

const getDefaultPropertyContext = (path: string, indetifier: string, expression?: string) => {
	const fullPath = getReferenceString(path, indetifier);

	return `(function(){
						if(${path} !== null && ${fullPath} !== undefined && ${fullPath} !== null) {
							return ${path}['${indetifier}']
						}
							else {
								return ${expression ?? 'null'}
							}
					}())`;
};

export class JavaScriptCodegen implements ICodegen {
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
	diagram: TStateDiagramMatrixIncludeNotes;
	handlersDict: string[];

	// initialContext: string;
	initialContextKeys: string[];
	changeStateHandlers: string[];

	constants: TConstants | null;
	expressions: TExpressionRecord;
	dictionaries: string[];
	protected imports = {
		'@yantrix/automata': ['GenericAutomata'],
	};

	constructor({ diagram, constants }: TModuleParams) {
		this.actionDictionary = new BasicActionDictionary();
		this.stateDictionary = new BasicStateDictionary();
		this.diagram = diagram;

		this.constants = constants;
		this.expressions = this.setupExpressions();

		this.handlersDict = [];
		this.changeStateHandlers = [];
		this.dictionaries = [];
		this.initialContextKeys = [];

		fillDictionaries(diagram, this.stateDictionary, this.actionDictionary);

		this.setupDictionaries();
	}

	public getImports() {
		let imports = '';
		for (const [key, value] of Object.entries(this.imports)) {
			imports += `import { ${value.join(', ')} } from '${key}';\n`;
		}
		return imports;
	}

	public getDictionaries(): string {
		return this.dictionaries.join('\n');
	}

	setupDictionaries() {
		this.dictionaries.push(
			`export const statesDictionary = ${JSON.stringify(this.stateDictionary.getDictionary(), null, 2)}`,
		);
		this.dictionaries.push(
			`export const actionsDictionary = ${JSON.stringify(this.actionDictionary.getDictionary(), null, 2)}`,
		);
		this.dictionaries.push(`const reducer = {${this.getStateToContext().join(',\n\t')}}`);
	}

	getClassTemplate(className: string) {
		const initialState = this.getInitialState();

		const stateValue = this.stateDictionary.getStateValues({ keys: [initialState] })[0];

		if (stateValue === null) {
			throw new Error('GetClassTemplate: Invalid state');
		}

		const a = this.getInitialContextShape(StartState);
		const b = this.getInitialContextShape(initialState);

		const initialContext = Object.assign({}, a, b);

		return `export class ${className} extends GenericAutomata {
  		 constructor() {
  			super();
  			this.init({
  				state: ${stateValue},
  				context:${JSON.stringify(initialContext)},
                rootReducer: ${this.getRootReducer()},
  				stateValidator: ${this.getStateValidator()},
  				actionValidator: ${this.getActionValidator()},
				});
			}
			isKeyOf = ${this.getIsKeyOf()};
		}`;
	}

	public getActionToStateFromState() {
		return `const actionToStateFromStateDict = {${this.getActionToStateFromStateDict().join('\n\t')}}`;
	}

	getStateToContext() {
		return this.diagram.states.map((state) => {
			const stateValue = this.stateDictionary.getStateValues({ keys: [state.id] })[0];

			if (!stateValue) {
				throw new Error('Invalid state');
			}

			return `${stateValue}: (prevContext, payload) => {
	
				return ${this.getContextTransition(stateValue)}
			}`;
		});
	}

	getActionToStateDict(transitions: Record<string, TDiagramAction>) {
		return Object.keys(transitions)
			.map((key) => {
				const { actionsPath } = transitions[key];
				const newState = this.stateDictionary.getStateValues({ keys: [key] })[0];
				return actionsPath.map(({ action }) => {
					const actionValue = this.actionDictionary.getActionValues({
						keys: action,
					})[0];
					if (!actionValue) throw new Error(`Action ${action} not found`);
					if (!newState) throw new Error(`State ${key} not found`);

					return `
				  ${actionValue}: {
				  	state: ${newState},
				  },
				`;
				});
			})
			.flatMap((el) => `${el.join('\n\t')}`);
	}

	protected getIsKeyOf() {
		return `(key, obj) => key in obj`;
	}

	public getDefaultContext() {
		const state = this.stateDictionary.getStateValues({ keys: [StartState] })[0];

		if (state !== null) {
			const ctx = this.getContextTransition(state);

			return `const getDefaultContext = (prevContext, payload) => { 
				const ctx = ${ctx} 
				return  Object.assign({}, prevContext, ctx);
			}
			`;
		}

		return `const getDefaultContext = (prevContext, payload) => { 

				return prevContext
		}`;
	}

	protected getRootReducer() {
		return `({ action, context, payload, state }) => {
					if (!action || payload === null) return { state, context };
					${this.getRootReducerStateValidation()}
					${this.getRootReducerActionValidation()}
					const {state:newState} = actionToStateFromStateDict[state][action]

					const contextWithInitial = getDefaultContext(context,payload)
					const newContextFunc = reducer[newState]

					if(typeof newContextFunc !== 'function') {
						throw new Error('Invalid newContextFunc')
					}
					return {state:newState, context: newContextFunc(contextWithInitial, payload)};
  				}`;
	}

	protected getRootReducerStateValidation() {
		return `${this.getRootReducerStateValidationHead()} ${this.getRootReducerStateValidationError()}`;
	}

	protected getRootReducerStateValidationHead() {
		return `if (!this.isKeyOf(state, actionToStateFromStateDict))`;
	}

	protected getRootReducerStateValidationError() {
		return `throw new Error("Invalid state, maybe machine isn't running.")`;
	}

	protected getRootReducerActionValidation() {
		return `if (!this.isKeyOf(action, actionToStateFromStateDict[state])) return { state, context };`;
	}

	protected getStateValidator() {
		return `(s) => Object.values(statesDictionary).includes(s)`;
	}

	protected getActionValidator() {
		return `(a) => Object.values(actionsDictionary).includes(a)`;
	}

	protected getActionToStateFromStateDict() {
		return Object.keys(this.diagram.transitions).map((state) => {
			const transitions = this.diagram.transitions[state];
			const value = this.stateDictionary.getStateValues({ keys: [state] })[0];
			if (!value) throw new Error(`State ${state} not found`);

			return `${value}: {${this.getActionToStateDict(transitions).join('\n\t')}},`;
		});
	}

	protected getContextTransition = (value: number) => {
		const stateFromDict = this.stateDictionary.getStateKeys({ states: [value] })[0];

		if (stateFromDict === null) {
			throw new Error(`Invalid state - ${value}`);
		}

		const diagramState = this.diagram.states.find((diagramState) => {
			return diagramState.id === stateFromDict;
		});

		if (!diagramState) {
			throw new Error(`Invalid state - ${value}`);
		}

		const ctxRes: string[] = [];

		diagramState.notes?.contextDescription.map((ctx) => {
			const newContext = this.getContextItem(ctx);

			ctxRes.push(...newContext);
		});

		if (ctxRes.length === 0) return 'null';

		return `{${ctxRes.join(',\n\t')}}`;
	};

	private getInitialState() {
		const hasInitial = this.diagram.states.find((state) => {
			return Boolean(state.notes?.initialState);
		});

		if (hasInitial) {
			return hasInitial.id;
		}

		const firstState = this.diagram.states[0].id;

		return firstState;
	}

	private getContextItem = (ctx: TContextItem) => {
		if (isContextWithReducer(ctx)) {
			const { context, reducer } = ctx;

			return reducer
				.map(({ keyItem }) => {
					if (isKeyItemReference(keyItem)) {
						const { expressionType, identifier: boundIdentifier } = keyItem;
						const path = pathRecord[expressionType];

						if (keyItem.expressionType === ExpressionTypes.Constant) {
							const expressionValueRight = this.getExpressionValue(keyItem);
							return `(function(){
								return ${expressionValueRight}
								}())`;
						}

						if (isKeyItemWithExpression(keyItem)) {
							const { expression } = keyItem;

							const expressionValueRight = this.getExpressionValue(expression);

							return getDefaultPropertyContext(path, boundIdentifier, expressionValueRight);
						} else {
							return getDefaultPropertyContext(path, boundIdentifier);
						}
					} else {
						const { expression } = keyItem;

						const expressionValueRight = this.getExpressionValue(expression);
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

						const expressionValueRight = this.getExpressionValue(expression);

						return `${targetProperty}: (function(){
						const boundValue = ${el}
						if(boundValue !== null){
							return boundValue
						}
						else {
							return ${expressionValueRight}
						}

					}())`;
					} else {
						return `${targetProperty}: (function(){
						const boundValue = ${el}

						return boundValue

					}())`;
					}
				});
		} else {
			const { context } = ctx;
			return context.map(({ keyItem }) => {
				const { identifier } = keyItem;
				if (isKeyItemWithExpression(keyItem)) {
					const expressionValue = this.getExpressionValue(keyItem.expression);

					return `${identifier}: ${getDefaultPropertyContext('prevContext', identifier, expressionValue)}`;
				} else {
					return `${identifier}: ${getDefaultPropertyContext('prevContext', identifier)}`;
				}
			});
		}
	};

	private getInitialContextShape = (stateName: string) => {
		const states = this.diagram.states.filter((state) => state.id === stateName);

		if (states.length) {
			return states.reduce(
				(acc, curr) => {
					curr.notes?.contextDescription.map((el) => {
						el.context.map((el) => {
							acc[el.keyItem.identifier] = null;
						});
					});
					return acc;
				},
				{} as Record<string, null>,
			);
		}

		return null;
	};
	private getExpressionValue(expression: TExpression<keyof TMapped>) {
		//@ts-expect-error // idk, help
		return this.expressions[expression.expressionType](expression);
	}
	private setupExpressions(): TExpressionRecord {
		return {
			[ExpressionTypes.ArrayDeclaration]: () => '[]',
			[ExpressionTypes.Constant]: ({ identifier }) => {
				if (this.constants === null) {
					throw new Error('Missing dictionary with constants');
				}

				if (this.constants[identifier] === undefined) {
					throw new Error(`The identifier is missing in the const dictionary: ${identifier}`);
				}
				if (typeof this.constants[identifier] === 'string') return `"${this.constants[identifier]}"`;

				return `${this.constants[identifier]}`;
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

									if (expression.expressionType === ExpressionTypes.Function) {
										currentRecLevel++;
										// @ts-ignore
										res.push(recursive(expression));
									}
									// @ts-ignore
									const valueExpression = this.getExpressionValue(expression);

									res.push(`${getDefaultPropertyContext(path, identifier, valueExpression)}`);
								} else {
									res.push(`${getDefaultPropertyContext(path, identifier)}`);
								}
							} else {
								if (item.expressionType === ExpressionTypes.Function) {
									// @ts-ignore
									res.push(recursive(item));
								} else {
									const valueExpression = this.getExpressionValue(item);
									res.push(valueExpression);
								}
							}
						});
					} else {
						throw new Error(`Max level of nested functions reached ${maxNestedFuncLevel}`);
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
				return `prevContext === null ||  (prevContext === undefined || prevContext['${identifier}'] === undefined) ? null : prevContext['${identifier}']`;
			},
			[ExpressionTypes.Payload]: ({ identifier }) => {
				return `payload === null || (payload === undefined  || payload['${identifier}'] === undefined) ? null : payload['${identifier}']`;
			},
		} as const;
	}
}
