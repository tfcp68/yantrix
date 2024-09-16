import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import { StartState, TDiagramAction } from '@yantrix/mermaid-parser';
import {
	ExpressionTypes,
	isContextWithReducer,
	isKeyItemReference,
	isKeyItemWithExpression,
	maxNestedFuncLevel,
	TContextItem,
	TExpression,
	TExpressionDefine,
	TExpressionDefineMap,
	TExpressionFunction,
	TMappedKeys,
} from '@yantrix/yantrix-parser';
import { ICodegen, TGetCodeOptionsMap, TModuleParams, TStateDiagramMatrixIncludeNotes } from '../../types/common.js';
import { replaceFileContents } from '../../utils/utils.js';
import { fillDictionaries, pathRecord } from '../shared.js';
import { TConstants, TExpressionRecord } from './../../types/common';
import { ModuleNames } from './index';

function getReferenceString(path: string, identifier: string) {
	return `${path}['${identifier}']`;
}

function getFunctionFromDictionary(name: string) {
	return `functionDictionary.get('${name}')`;
}

function getDefaultPropertyContext(path: string, indetifier: string, expression?: string) {
	const fullPath = getReferenceString(path, indetifier);

	return `(function(){
						if(${path} !== null && ${fullPath} !== undefined && ${fullPath} !== null) {
							return ${path}['${indetifier}']
						}
							else {
								return ${expression ?? 'null'}
							}
					}())`;
}

export class JavaScriptCodegen implements ICodegen<typeof ModuleNames.JavaScript> {
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
	diagram: TStateDiagramMatrixIncludeNotes;
	handlersDict: string[];

	// initialContext: string;
	initialContextKeys: string[];
	changeStateHandlers: string[];
	dependencyGraph: Map<string, Set<string>>;
	constants: TConstants | null;
	expressions: TExpressionRecord;
	dictionaries: string[];
	protected imports = {
		'@yantrix/automata': ['GenericAutomata', 'FunctionDictionary'],
		'@yantrix/functions': ['builtInFunctions'],
	};

	constructor({ diagram, constants }: TModuleParams) {
		this.actionDictionary = new BasicActionDictionary();
		this.stateDictionary = new BasicStateDictionary();

		this.diagram = diagram;

		this.constants = constants;

		this.expressions = this.setupExpressions();

		this.dependencyGraph = new Map();
		this.buildDependencyGraph();

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
		this.dictionaries.push(`export const functionDictionary = new FunctionDictionary();`);

		this.dictionaries.push();
		this.checkForCyclicDependencies();
		this.registerCustomFunctions();
	}

	private getFunctionBody(expression: TExpressionDefineMap): string {
		if (expression.expressionType === ExpressionTypes.Function) {
			const { FunctionName, Arguments } = expression.FunctionDeclaration;

			const argsList = Arguments.map((arg) => {
				if (arg.expressionType === ExpressionTypes.Function) {
					return this.getFunctionBody(arg);
				} else {
					return this.getExpressionValueDefine(arg);
				}
			}).join(', ');

			return `(function() {
				const func = functionDictionary.get('${FunctionName}');
				return func(${argsList});
			})()`;
		} else {
			return this.getExpressionValueDefine(expression);
		}
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

		return replaceFileContents(

			{
				'%CLASSNAME%': className,
				'%ID%': `'${className}'`,
				'%ACTIONS_MAP%': 'actionsMap',
				'%STATES_MAP%': 'statesMap',
				'%GET_STATE%': this.getGetStateFunc().toString(),
				'%HAS_STATE%': this.getHasStateFunc(className).toString(),
				'%GET_ACTION%': this.getGetActionFunc().toString(),
				'%CREATE_ACTION%': this.getCreateActionFunc(className).toString(),
				'%STATE%': (stateValue ?? -1).toString(),
				'%CONTEXT%': JSON.stringify(initialContext),
				'%REDUCER%': this.getRootReducer().toString(),
				'%S_VALIDATOR%': this.getStateValidator().toString(),
				'%A_VALIDATOR%': this.getActionValidator().toString(),
				'%F_REGISTRY%': 'functionDictionary',
				'%IS_KEY_OF%': this.getIsKeyOf().toString(),
			},
		);
	}

	protected getHasStateFunc(className: string) {
		return `(instance, state) => instance.state === ${className}.getState(state)`;
	}

	protected getGetStateFunc() {
		return `(state) => statesDictionary[state]`;
	}

	public getCode(options: TGetCodeOptionsMap[typeof ModuleNames.JavaScript]) {
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

	getObjectKeysMap(dict: Record<any, any>) {
		const obj: Record<string, string> = {};
		Object.keys(dict).forEach((key: string) => {
			obj[key] = key;
		});
		return obj;
	}

	getActionsMap() {
		return this.getObjectKeysMap(this.actionDictionary.getDictionary());
	}

	getStatesMap() {
		return this.getObjectKeysMap(this.stateDictionary.getDictionary());
	}

	protected getGetActionFunc() {
		return `(action) => actionsDictionary[action];`;
	}

	protected getCreateActionFunc(className: string) {
		return `
		(action, payload) => {
			const actionId = ${className}.getAction(action);
			return {
				action: actionId,
				payload,
			}
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

			return `${stateValue}: (prevContext, payload, functionDictionary) => {
	
				return ${this.getContextTransition(stateValue)}
			}`;
		});
	}

	getActionToStateDict(transitions: Record<string, TDiagramAction>) {
		return Object
			.entries(transitions)
			.map(([key, transition]) => {
				const newState = this.stateDictionary.getStateValues({ keys: [key] })[0];
				return transition.actionsPath.map(({ action }) => {
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
			.flatMap(el => `${el.join('\n\t')}`);
	}

	protected getIsKeyOf() {
		return `(key, obj) => key in obj`;
	}

	public getDefaultContext() {
		const state = this.stateDictionary.getStateValues({ keys: [StartState] })[0];

		if (state) {
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
					return {state:newState, context: newContextFunc(contextWithInitial, payload, this.getFunctionRegistry())};
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

	private buildDependencyGraph(): void {
		const defines = this.diagram.states.flatMap(state => state.notes?.defines ?? []);

		const addDependencies = (expression: TExpressionDefine<'function'>, currentFunc: string) => {
			const { FunctionName, Arguments } = expression.FunctionDeclaration;

			this.imports['@yantrix/functions'].push(FunctionName);

			if (!this.dependencyGraph.has(currentFunc)) {
				this.dependencyGraph.set(currentFunc, new Set());
			}

			this.dependencyGraph.get(currentFunc)!.add(FunctionName);

			for (const arg of Arguments) {
				if (arg.expressionType === 'function') {
					addDependencies(arg, currentFunc);
				}
			}
		};

		for (const define of defines) {
			if (define.expression.expressionType === ExpressionTypes.Function) {
				addDependencies(define.expression, define.identifier);
			}
		}
	}

	private detectCycles(): string[][] {
		const visited = new Set<string>();
		const recursionStack = new Set<string>();
		const cycles: string[][] = [];

		const dfs = (node: string, path: string[] = []): boolean => {
			if (!visited.has(node)) {
				visited.add(node);
				recursionStack.add(node);

				const neighbors = this.dependencyGraph.get(node) || new Set();
				for (const neighbor of neighbors) {
					if (!visited.has(neighbor)) {
						if (dfs(neighbor, [...path, node])) {
							return true;
						}
					} else if (recursionStack.has(neighbor)) {
						cycles.push([...path, node, neighbor]);
						return true;
					}
				}
			}

			recursionStack.delete(node);
			return false;
		};

		for (const node of this.dependencyGraph.keys()) {
			if (!visited.has(node)) {
				dfs(node);
			}
		}

		return cycles;
	}

	private checkForCyclicDependencies() {
		const cycles = this.detectCycles();
		if (cycles.length > 0) {
			const cycleStrings = cycles.map(cycle => cycle.join(' -> '));
			throw new Error(`Cyclic dependencies detected in function definitions:\n${cycleStrings.join('\n')}`);
		}
	}

	private registerCustomFunctions() {
		const defines = this.diagram.states.flatMap(state => state.notes?.defines ?? []);
		const registered = new Set<string>();

		const registerFunction = (funcName: string) => {
			if (registered.has(funcName)) return;

			const funcDef = defines.find(def => def.identifier === funcName);
			if (!funcDef) return;

			const dependencies = this.dependencyGraph.get(funcName) || new Set();
			for (const dep of dependencies) {
				if (!registered.has(dep)) {
					registerFunction(dep);
				}
			}

			const functionBody = this.getFunctionBody(funcDef.expression);
			this.dictionaries.push(`functionDictionary.register('${funcName}', function(${funcDef.Arguments.join(', ')}) {
				return ${functionBody};
			});`);
			registered.add(funcName);
		};

		for (const funcName of this.dependencyGraph.keys()) {
			if (!registered.has(funcName)) {
				registerFunction(funcName);
			}
		}
	}

	protected getActionValidator() {
		return `(a) => Object.values(actionsDictionary).includes(a)`;
	}

	protected getActionToStateFromStateDict() {
		const actionToStartStateMatrix: Record<string, TDiagramAction> = {};

		Object.entries(this.diagram.transitions).forEach(([state, transitions]) => {
			if (state === StartState) {
				const entries = Object.entries(transitions);
				console.log(entries, 'entries');
				entries.forEach(([state, action]) => {
					action.actionsPath.forEach(({ action }) => {
						actionToStartStateMatrix[state] = {
							actionsPath: [{ action, note: [] }],
						};
					});
				});
			}
		});

		const isExistsStartState = Object.keys(actionToStartStateMatrix).length > 0;

		return Object.entries(this.diagram.transitions).map(([state, transitions]) => {
			const value = this.stateDictionary.getStateValues({ keys: [state] })[0];
			if (!value) throw new Error(`State ${state} not found`);
			if (isExistsStartState && state !== StartState) {
				transitions = {
					...transitions,
					...actionToStartStateMatrix,
				};
			}

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

		diagramState.notes?.contextDescription.forEach((ctx) => {
			const newContext = this.getContextItem(ctx);

			ctxRes.push(...newContext);
		});

		if (ctxRes.length === 0) return 'prevContext';

		return `{${ctxRes.join(',\n\t')}}`;
	};

	private getInitialState() {
		const hasInitial = this.diagram.states.find((state) => {
			return Boolean(state.notes?.initialState);
		});

		if (hasInitial) {
			return hasInitial.id;
		}

		const firstState = this.diagram.states[0]?.id;

		if (!firstState) {
			throw new Error('Invalid state');
		}

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
		const states = this.diagram.states.filter(state => state.id === stateName);

		if (states.length) {
			return states.reduce(
				(acc, curr) => {
					curr.notes?.contextDescription.forEach((el) => {
						el.context.forEach((el) => {
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

	private getExpressionValue<T extends TMappedKeys>(expression: TExpression<T>) {
		return this.expressions[expression.expressionType](expression);
	}

	private getExpressionValueDefine(expression: TExpressionDefineMap) {
		switch (expression.expressionType) {
			case ExpressionTypes.Identifier:
				return expression.identifier;
			case ExpressionTypes.Function:
				return this.getFunctionBody(expression);
			default:
				return this.getExpressionValue(expression);
		}
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
										res.push(recursive(expression));
									}

									const valueExpression = this.getExpressionValue(expression);

									res.push(`${getDefaultPropertyContext(path, identifier, valueExpression)}`);
								} else {
									if (item.expressionType === ExpressionTypes.Constant) {
										const expressionValueRight = this.getExpressionValue(item);
										res.push(expressionValueRight);
									} else {
										res.push(`${getDefaultPropertyContext(path, identifier)}`);
									}
								}
							} else {
								if (item.expressionType === ExpressionTypes.Function) {
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
