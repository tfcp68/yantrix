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
// import { replaceFileContents } from '../../utils/utils.js';
import { fillDictionaries, pathRecord } from '../shared.js';
import { PythonTemplate } from '../templates/Python.js';
import { TConstants, TExpressionRecord } from './../../types/common';
import { ModuleNames } from './index';

function getReferenceString(path: string, identifier: string) {
	return `${path}['${identifier}']`;
}

function getFunctionFromDictionary(name: string) {
	return `functionDictionary.get('${name}')`;
}

function getDefaultPropertyContext(
	path: string,
	identifier: string,
	expression?: string,
) {
	const fullPath = getReferenceString(path, identifier);

	return `(lambda: ${path} is not None and ${fullPath} is not None and ${fullPath} or ${expression ?? 'None'})()`;
}

export class PythonCodegen implements ICodegen<typeof ModuleNames.Python> {
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
	diagram: TStateDiagramMatrixIncludeNotes;
	handlersDict: string[];

	initialContextKeys: string[];
	changeStateHandlers: string[];
	dependencyGraph: Map<string, Set<string>>;
	constants: TConstants | null;
	expressions: TExpressionRecord;
	dictionaries: string[];
	protected imports = {
		'yantrix.automata': ['GenericAutomata', 'FunctionDictionary'],
		'yantrix.codegen': ['builtInFunctions'],
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
		const imports = '';
		// for (const [key, value] of Object.entries(this.imports)) {
		// 	imports += `from ${key} import ${value.join(', ')}\n`;
		// }
		return imports;
	}

	public getDictionaries(): string {
		return this.dictionaries.join('\n');
	}

	setupDictionaries() {
		this.dictionaries.push(
			`statesDictionary = ${JSON.stringify(this.stateDictionary.getDictionary(), null, 2)}`,
		);
		this.dictionaries.push(
			`actionsDictionary = ${JSON.stringify(this.actionDictionary.getDictionary(), null, 2)}`,
		);
		this.dictionaries.push(`reducer = {\n${this.getStateToContext().join(',\n')}\n}`);
		this.dictionaries.push(`functionDictionary = FunctionDictionary()`);
		this.dictionaries.push(`functionDictionary.register(builtInFunctions)`);

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

			return `(lambda: functionDictionary.get('${FunctionName}')(${argsList}))()`;
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

		return this.replaceFileContents(
			{
				'%CLASSNAME%': className,
				'%ID%': `'${className}'`,
				'%ACTIONS_MAP%': 'actionsMap',
				'%STATES_MAP%': 'statesMap',
				'%GET_STATE%': this.getGetStateFunc().toString(),
				'%HAS_STATE%': this.getHasStateFunc().toString(),
				'%GET_ACTION%': this.getGetActionFunc().toString(),
				'%CREATE_ACTION%': this.getCreateActionFunc().toString(),
				'%STATE%': (stateValue ?? -1).toString(),
				'%CONTEXT%': JSON.stringify(initialContext).replace(/null/g, 'None'),
				'%REDUCER%': this.getRootReducer().toString(),
				'%S_VALIDATOR%': this.getStateValidator().toString(),
				'%A_VALIDATOR%': this.getActionValidator().toString(),
				'%F_REGISTRY%': 'functionDictionary',
				'%IS_KEY_OF%': this.getIsKeyOf().toString(),
			},
		);
	}

	replaceFileContents(replacementMap: Record<string, string>): string {
		let res = PythonTemplate;
		Object.entries(replacementMap).forEach(([template, str]) => {
			res = res.replaceAll(template, str);
		});
		return res;
	}

	protected getHasStateFunc() {
		const content = [`def hasState(self, instance, state):`, `\treturn instance.state == self.getState(state)`];
		return content.join('\n');
	}

	protected getGetStateFunc() {
		const content = [`def getState(self, state):`, `\treturn statesDictionary[state]`];
		return content.join('\n');
	}

	public async getCode(options: TGetCodeOptionsMap[typeof ModuleNames.Python]) {
		return `
${this.getImports()}
${this.getDictionaries()}
actionsMap = ${JSON.stringify(this.getActionsMap(), null, 2)}
statesMap = ${JSON.stringify(this.getStatesMap(), null, 2)}
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
		const content = [`def getAction(self, action):`, `\treturn actionsDictionary[action]`];
		return content.join('\n');
	}

	protected getCreateActionFunc() {
		const content = [`def createAction(self, action, payload):`, `\treturn {"action": self.getAction(action), "payload": payload}`];
		return content.join('\n');
	}

	public getActionToStateFromState() {
		return `actionToStateFromStateDict = {\n${this.getActionToStateFromStateDict().join('\n')}\n}`;
	}

	getStateToContext() {
		return this.diagram.states.map((state) => {
			const stateValue = this.stateDictionary.getStateValues({
				keys: [state.id],
			})[0];

			if (!stateValue) {
				throw new Error('Invalid state');
			}

			return `${stateValue}: lambda prevContext, payload, functionDictionary: ${this.getContextTransition(stateValue)}`;
		});
	}

	getActionToStateDict(transitions: Record<string, TDiagramAction>) {
		return Object.entries(transitions)
			.map(([key, transition]) => {
				const newState = this.stateDictionary.getStateValues({
					keys: [key],
				})[0];
				return transition.actionsPath.map(({ action }) => {
					const actionValue = this.actionDictionary.getActionValues({
						keys: action,
					})[0];
					if (!actionValue) throw new Error(`Action ${action} not found`);
					if (!newState) throw new Error(`State ${key} not found`);

					return `
    ${actionValue}: {
        "state": ${newState},
    },
`;
				});
			})
			.flatMap(el => `${el.join('\n')}`);
	}

	protected getIsKeyOf() {
		const content = [`def isKeyOf(self, key, obj):`, `return key in obj`];
		return content.join('\n\t\t');
	}

	public getDefaultContext() {
		const state = this.stateDictionary.getStateValues({
			keys: [StartState],
		})[0];

		if (state) {
			const ctx = this.getContextTransition(state);
			const content = [`def getDefaultContext(prevContext, payload):`, `ctx = ${ctx}`, `return {**prevContext, **ctx}`];
			return content.join('\n\t');
		}
		const content = [`def getDefaultContext(prevContext, payload):`, `return prevContext`];
		return content.join('\n\t');
	}

	protected getRootReducer() {
		const content = [
			`def rootReducer(self, action, context, payload, state):`,
			`if (not action) or (payload is None):`,
			`\treturn {'state': state, 'context': context}`,
			`${this.getRootReducerStateValidation()}`,
			`${this.getRootReducerActionValidation()}`,
			`newState = actionToStateFromStateDict[state][action]["state"]`,
			`contextWithInitial = getDefaultContext(context, payload)`,
			`newContextFunc = reducer[newState]`,
			`if not callable(newContextFunc):`,
			`\traise Exception('Invalid newContextFunc')`,
			`return {"state": newState, "context": newContextFunc(contextWithInitial, payload, self.getFunctionRegistry())}`, // TODO self.getFunctionRegistry поправить
		];
		return content.join('\n\t');
	}

	protected getRootReducerStateValidation() {
		const context = [
			`${this.getRootReducerStateValidationHead()}`,
			`\t\t${this.getRootReducerStateValidationError()}`,
		];
		return context.join('\n');
	}

	protected getRootReducerStateValidationHead() {
		return `if not self.isKeyOf(state, actionToStateFromStateDict)`;
	}

	protected getRootReducerStateValidationError() {
		return `raise Exception("Invalid state, maybe machine isn't running.")`;
	}

	protected getRootReducerActionValidation() {
		const content = [
			`if not self.isKeyOf(action, actionToStateFromStateDict[state]):`,
			`return {'state': state, 'context': context }`,
		];
		return content.join('\n\t\t');
	}

	protected getStateValidator() {
		const content = [`def stateValidator(self, s):`, `return s in statesDictionary.values()`];
		return content.join('\n\t\t');
	}

	private buildDependencyGraph(): void {
		const defines = this.diagram.states.flatMap(
			state => state.notes?.defines ?? [],
		);

		const addDependencies = (expression: TExpressionDefine<'function'>, currentFunc: string) => {
			const { FunctionName, Arguments } = expression.FunctionDeclaration;

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
		const defines = this.diagram.states.flatMap(
			state => state.notes?.defines ?? [],
		);
		const registered = new Set<string>();

		const registerFunction = (funcName: string) => {
			if (registered.has(funcName)) return;

			const funcDef = defines.find(def => def.identifier === funcName);
			if (!funcDef) return;

			const dependencies = this.dependencyGraph
				.get(funcName) || new Set();
			for (const dep of dependencies) {
				if (!registered.has(dep)) {
					registerFunction(dep);
				}
			}

			const functionBody = this.getFunctionBody(funcDef.expression);
			this.dictionaries.push(`functionDictionary.register('${funcName}', lambda ${funcDef.Arguments.join(', ')}: ${functionBody})`);
			registered.add(funcName);
		};

		for (const funcName of this.dependencyGraph.keys()) {
			if (!registered.has(funcName)) {
				registerFunction(funcName);
			}
		}
	}

	protected getActionValidator() {
		const content = [`def actionValidator(self, a):`, `return a in actionsDictionary.values()`];
		return content.join('\n\t\t');
	}

	protected getActionToStateFromStateDict() {
		const actionToStartStateMatrix: Record<string, TDiagramAction> = {};

		Object.entries(this.diagram.transitions).forEach(
			([state, transitions]) => {
				if (state === StartState) {
					const entries = Object.entries(transitions);
					entries.forEach(([state, action]) => {
						action.actionsPath.forEach(({ action }) => {
							actionToStartStateMatrix[state] = {
								actionsPath: [{ action, note: [] }],
							};
						});
					});
				}
			},
		);

		const isExistsStartState = Object.keys(
			actionToStartStateMatrix,
		).length > 0;

		return Object.entries(this.diagram.transitions).map(
			([state, transitions]) => {
				const value = this.stateDictionary.getStateValues({
					keys: [state],
				})[0];
				if (!value) throw new Error(`State ${state} not found`);
				if (isExistsStartState && state !== StartState) {
					transitions = {
						...transitions,
						...actionToStartStateMatrix,
					};
				}

				return `${value}: {\n${this.getActionToStateDict(transitions).join('\n')}\n},`;
			},
		);
	}

	protected getContextTransition = (value: number) => {
		const stateFromDict = this.stateDictionary.getStateKeys({
			states: [value],
		})[0];

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

		return `{\n${ctxRes.join(',\n')}\n}`;
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
						const {
							expressionType,
							identifier: boundIdentifier,
						} = keyItem;
						const path = pathRecord[expressionType];

						if (
							keyItem.expressionType === ExpressionTypes.Constant
						) {
							const expressionValueRight = this
								.getExpressionValue(keyItem);
							return `(lambda: ${expressionValueRight})()`;
						}

						if (isKeyItemWithExpression(keyItem)) {
							const { expression } = keyItem;

							const expressionValueRight = this
								.getExpressionValue(expression);

							return getDefaultPropertyContext(
								path,
								boundIdentifier,
								expressionValueRight,
							);
						} else {
							return getDefaultPropertyContext(
								path,
								boundIdentifier,
							);
						}
					} else {
						const { expression } = keyItem;

						const expressionValueRight = this.getExpressionValue(
							expression,
						);
						return `(lambda: ${expressionValueRight})()`;
					}
				})
				.map((el, index) => {
					const item = context[index];
					if (!item) {
						throw new Error('Unexpected index bound property');
					}
					const { keyItem } = item;
					const { identifier: targetProperty } = keyItem;

					if (isKeyItemWithExpression(keyItem)) {
						const { expression } = keyItem;

						const expressionValueRight = this.getExpressionValue(
							expression,
						);

						return `'${targetProperty}': (lambda: boundValue = ${el}; boundValue if boundValue is not None else ${expressionValueRight})()`;
					} else {
						return `'${targetProperty}': (lambda: boundValue = ${el}; boundValue)()`;
					}
				});
		} else {
			const { context } = ctx;
			return context.map(({ keyItem }) => {
				const { identifier } = keyItem;
				if (isKeyItemWithExpression(keyItem)) {
					const expressionValue = this.getExpressionValue(
						keyItem.expression,
					);

					return `'${identifier}': ${getDefaultPropertyContext('prevContext', identifier, expressionValue)}`;
				} else {
					return `'${identifier}': ${getDefaultPropertyContext('prevContext', identifier)}`;
				}
			});
		}
	};

	private getInitialContextShape = (stateName: string) => {
		const states = this.diagram.states.filter(
			state => state.id === stateName,
		);

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

	private getExpressionValue<T extends TMappedKeys>(
		expression: TExpression<T>,
	) {
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

					return `${getFunctionFromDictionary(FunctionName)}(${res.join(', ')})`;
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
				return `prevContext.get('${identifier}')`;
			},
			[ExpressionTypes.Payload]: ({ identifier }) => {
				return `payload.get('${identifier}')`;
			},
		} as const;
	}
}
