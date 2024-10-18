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
import { TConstants, TExpressionRecord, TStateDiagramMatrixIncludeNotes } from '../../../types/common';
import { replaceFileContents } from '../../../utils/utils';
import { pathRecord } from '../../shared';

export function getActionToStateDictCode(props: {
	transitions: Record<string, TDiagramAction>;
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
}) {
	return Object
		.entries(props.transitions)
		.map(([key, transition]) => {
			const newState = props.stateDictionary.getStateValues({ keys: [key] })[0];
			return transition.actionsPath.map(({ action }) => {
				const actionValue = props.actionDictionary.getActionValues({
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

export function getActionToStateFromStateDict(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
}) {
	const actionToStartStateMatrix: Record<string, TDiagramAction> = {};

	Object.entries(props.diagram.transitions).forEach(([state, transitions]) => {
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
	});

	const isExistsStartState = Object.keys(actionToStartStateMatrix).length > 0;

	return Object.entries(props.diagram.transitions).map(([state, transitions]) => {
		const value = props.stateDictionary.getStateValues({ keys: [state] })[0];
		if (!value) throw new Error(`State ${state} not found`);
		if (isExistsStartState && state !== StartState) {
			transitions = {
				...transitions,
				...actionToStartStateMatrix,
			};
		}

		return `${value}: {${getActionToStateDictCode({
			stateDictionary: props.stateDictionary,
			actionDictionary: props.actionDictionary,
			transitions,
		}).join('\n\t')}},`;
	});
}

export function getDictionariesCode(props: {
	dictionaries: TDictionaries;
}): string {
	return props.dictionaries.join('\n');
}

export function setupDictionaries(props: {
	dependencyGraph: TDependencyGraph;
	diagram: TStateDiagramMatrixIncludeNotes;
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
	expressions: TExpressionRecord;
}) {
	let dictionaries: TDictionaries = [];
	dictionaries.push(
		`export const statesDictionary = ${JSON.stringify(props.stateDictionary.getDictionary(), null, 2)}`,
	);
	dictionaries.push(
		`export const actionsDictionary = ${JSON.stringify(props.actionDictionary.getDictionary(), null, 2)}`,
	);
	dictionaries.push(`const reducer = {${getStateToContext({
		diagram: props.diagram,
		stateDictionary: props.stateDictionary,
		actionDictionary: props.actionDictionary,
		expressions: props.expressions,
	}).join(',\n\t')}}`);
	dictionaries.push(`export const functionDictionary = new FunctionDictionary();`);
	dictionaries.push(`functionDictionary.register(builtInFunctions);`);
	dictionaries.push();
	checkForCyclicDependencies({
		dependencyGraph: props.dependencyGraph,
	});
	dictionaries = registerCustomFunctions({
		diagram: props.diagram,
		expressions: props.expressions,
		dependencyGraph: props.dependencyGraph,
		dictionaries,
	});
	return dictionaries;
}

export function getStateToContext(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
	expressions: TExpressionRecord;
}) {
	return props.diagram.states.map((state) => {
		const stateValue = props.stateDictionary.getStateValues({ keys: [state.id] })[0];

		if (!stateValue) {
			throw new Error('Invalid state');
		}

		return `${stateValue}: (prevContext, payload, functionDictionary) => {

				return ${getContextTransition({
		value: stateValue,
		stateDictionary: props.stateDictionary,
		diagram: props.diagram,
		expressions: props.expressions,
	})}
			}`;
	});
}

export function getContextTransition(props: {
	value: number;
	stateDictionary: BasicStateDictionary;
	diagram: TStateDiagramMatrixIncludeNotes;
	expressions: TExpressionRecord;
}) {
	const stateFromDict = props.stateDictionary.getStateKeys({ states: [props.value] })[0];

	if (stateFromDict === null) {
		throw new Error(`Invalid state - ${props.value}`);
	}

	const diagramState = props.diagram.states.find((diagramState) => {
		return diagramState.id === stateFromDict;
	});

	if (!diagramState) {
		throw new Error(`Invalid state - ${props.value}`);
	}

	const ctxRes: string[] = [];

	diagramState.notes?.contextDescription.forEach((ctx) => {
		const newContext = getContextItem({
			ctx,
			expressions: props.expressions,
		});

		ctxRes.push(...newContext);
	});

	if (ctxRes.length === 0) return 'prevContext';

	return `{${ctxRes.join(',\n\t')}}`;
};

export function getContextItem(props: {
	ctx: TContextItem;
	expressions: TExpressionRecord;
}) {
	if (isContextWithReducer(props.ctx)) {
		const { context, reducer } = props.ctx;

		return reducer
			.map(({ keyItem }) => {
				if (isKeyItemReference(keyItem)) {
					const { expressionType, identifier: boundIdentifier } = keyItem;
					const path = pathRecord[expressionType];

					if (keyItem.expressionType === ExpressionTypes.Constant) {
						const expressionValueRight = getExpressionValue({
							expression: keyItem,
							expressionRecord: props.expressions,
						});
						return `(function(){
								return ${expressionValueRight}
								}())`;
					}

					if (isKeyItemWithExpression(keyItem)) {
						const { expression } = keyItem;

						const expressionValueRight = getExpressionValue({
							expression,
							expressionRecord: props.expressions,
						});

						return getDefaultPropertyContext(path, boundIdentifier, expressionValueRight);
					} else {
						return getDefaultPropertyContext(path, boundIdentifier);
					}
				} else {
					const { expression } = keyItem;

					const expressionValueRight = getExpressionValue({
						expression,
						expressionRecord: props.expressions,
					});
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

					const expressionValueRight = getExpressionValue({
						expression,
						expressionRecord: props.expressions,
					});

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
		const { context } = props.ctx;
		return context.map(({ keyItem }) => {
			const { identifier } = keyItem;
			if (isKeyItemWithExpression(keyItem)) {
				const expressionValue = getExpressionValue({
					expression: keyItem.expression,
					expressionRecord: props.expressions,
				});

				return `${identifier}: ${getDefaultPropertyContext('prevContext', identifier, expressionValue)}`;
			} else {
				return `${identifier}: ${getDefaultPropertyContext('prevContext', identifier)}`;
			}
		});
	}
};

export function checkForCyclicDependencies(props: {
	dependencyGraph: TDependencyGraph;
}) {
	const cycles = detectCycles({
		dependencyGraph: props.dependencyGraph,
	});
	if (cycles.length > 0) {
		const cycleStrings = cycles.map(cycle => cycle.join(' -> '));
		throw new Error(`Cyclic dependencies detected in function definitions:\n${cycleStrings.join('\n')}`);
	}
}

export function detectCycles(props: {
	dependencyGraph: TDependencyGraph;
}): string[][] {
	const visited = new Set<string>();
	const recursionStack = new Set<string>();
	const cycles: string[][] = [];

	const dfs = (node: string, path: string[] = []): boolean => {
		if (!visited.has(node)) {
			visited.add(node);
			recursionStack.add(node);

			const neighbors = props.dependencyGraph.get(node) || new Set();
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

	for (const node of props.dependencyGraph.keys()) {
		if (!visited.has(node)) {
			dfs(node);
		}
	}

	return cycles;
}

export function registerCustomFunction(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	dependencyGraph: TDependencyGraph;
	dictionaries: TDictionaries;
	expressions: TExpressionRecord;
}) {
	const defines = props.diagram.states.flatMap(state => state.notes?.defines ?? []);
	const registered = new Set<string>();

	const registerFunction = (funcName: string) => {
		if (registered.has(funcName)) return;

		const funcDef = defines.find(def => def.identifier === funcName);
		if (!funcDef) return;

		const dependencies = props.dependencyGraph.get(funcName) || new Set();
		for (const dep of dependencies) {
			if (!registered.has(dep)) {
				registerFunction(dep);
			}
		}

		const functionBody = getFunctionBody({
			expressions: props.expressions,
			expression: funcDef.expression,

		});
		props.dictionaries.push(`functionDictionary.register('${funcName}', function(${funcDef.Arguments.join(', ')}) {
				return ${functionBody};
			});`);
		registered.add(funcName);
	};

	for (const funcName of props.dependencyGraph.keys()) {
		if (!registered.has(funcName)) {
			registerFunction(funcName);
		}
	}
}

export function getDefaultPropertyContext(path: string, indetifier: string, expression?: string) {
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

function getReferenceString(path: string, identifier: string) {
	return `${path}['${identifier}']`;
}

export type TDictionaries = string[];
export type TDependencyGraph = Map<string, Set<string>>;

export function registerCustomFunctions(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	dependencyGraph: TDependencyGraph;
	dictionaries: TDictionaries;
	expressions: TExpressionRecord;
}) {
	const newDictionary = props.dictionaries;
	const defines = props.diagram.states.flatMap(state => state.notes?.defines ?? []);
	const registered = new Set<string>();

	const registerFunction = (funcName: string) => {
		if (registered.has(funcName)) return;

		const funcDef = defines.find(def => def.identifier === funcName);
		if (!funcDef) return;

		const dependencies = props.dependencyGraph.get(funcName) || new Set();
		for (const dep of dependencies) {
			if (!registered.has(dep)) {
				registerFunction(dep);
			}
		}

		const functionBody = getFunctionBody({
			expression: funcDef.expression,
			expressions: props.expressions,
		});
		newDictionary.push(`functionDictionary.register('${funcName}', function(${funcDef.Arguments.join(', ')}) {
				return ${functionBody};
			});`);
		registered.add(funcName);
	};

	for (const funcName of props.dependencyGraph.keys()) {
		if (!registered.has(funcName)) {
			registerFunction(funcName);
		}
	}

	return newDictionary;
}

export function getExpressionValue<T extends TMappedKeys>(props: {
	expressionRecord: TExpressionRecord;
	expression: TExpression<T>;
}) {
	return props.expressionRecord[props.expression.expressionType](props.expression);
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
				expressionRecord: props.expressions,
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
					expression: arg,
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
	constants: TConstants | null;
}): TExpressionRecord {
	const expressionRecord: TExpressionRecord = {
		[ExpressionTypes.ArrayDeclaration]: () => '[]',
		[ExpressionTypes.Constant]: ({ identifier }) => {
			if (props.constants === null) {
				throw new Error('Missing dictionary with constants');
			}

			if (props.constants[identifier] === undefined) {
				throw new Error(
					`The identifier is missing in the const dictionary: ${identifier}`,
				);
			}
			if (typeof props.constants[identifier] === 'string')
				return `"${props.constants[identifier]}"`;

			return `${props.constants[identifier]}`;
		},
		[ExpressionTypes.Function]: () => {
			return 'null';
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

	expressionRecord[ExpressionTypes.Function] = (func) => {
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
									expressionRecord,
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
										expressionRecord,
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
									expressionRecord,
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
	};

	return expressionRecord;
}

export type TImports = {
	[path: string]: string[];
};

export function getImportsCode(props: {
	imports: TImports;
}) {
	let imports = '';
	for (const [key, value] of Object.entries(props.imports)) {
		imports += `import { ${value.join(', ')} } from '${key}';\n`;
	}
	return imports;
}

export function getFunctionFromDictionary(name: string) {
	return `functionDictionary.get('${name}')`;
}

export function getClassTemplate(props: {
	className: string;
	diagram: TStateDiagramMatrixIncludeNotes;
	stateDictionary: BasicStateDictionary;
}) {
	const initialState = getInitialState({
		diagram: props.diagram,
	});

	const stateValue = props.stateDictionary.getStateValues({ keys: [initialState] })[0];

	if (stateValue === null) {
		throw new Error('GetClassTemplate: Invalid state');
	}

	const a = getInitialContextShape({
		diagram: props.diagram,
		stateName: StartState,
	});
	const b = getInitialContextShape({
		diagram: props.diagram,
		stateName: initialState,
	});

	const initialContext = Object.assign({}, a, b);

	return replaceFileContents(

		{
			'%CLASSNAME%': props.className,
			'%ID%': `'${props.className}'`,
			'%ACTIONS_MAP%': 'actionsMap',
			'%STATES_MAP%': 'statesMap',
			'%GET_STATE%': getGetStateFunc().toString(),
			'%HAS_STATE%': getHasStateFunc({ className: props.className }).toString(),
			'%GET_ACTION%': getGetActionFunc().toString(),
			'%CREATE_ACTION%': getCreateActionFunc({ className: props.className }).toString(),
			'%STATE%': (stateValue ?? -1).toString(),
			'%CONTEXT%': JSON.stringify(initialContext),
			'%REDUCER%': getRootReducer().toString(),
			'%S_VALIDATOR%': getStateValidator().toString(),
			'%A_VALIDATOR%': getActionValidator().toString(),
			'%F_REGISTRY%': 'functionDictionary',
			'%IS_KEY_OF%': getIsKeyOf().toString(),
		},
	);
}

export function getInitialState(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
}) {
	const hasInitial = props.diagram.states.find((state) => {
		return Boolean(state.notes?.initialState);
	});

	if (hasInitial) {
		return hasInitial.id;
	}

	const firstState = props.diagram.states[0]?.id;

	if (!firstState) {
		throw new Error('Invalid state');
	}

	return firstState;
}

export function getInitialContextShape(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	stateName: string;
}) {
	const states = props.diagram.states.filter(state => state.id === props.stateName);

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

export function getHasStateFunc(props: { className: string }) {
	return `(instance, state) => instance.state === ${props.className}.getState(state)`;
}

export function getGetStateFunc() {
	return `(state) => statesDictionary[state]`;
}

export function getGetActionFunc() {
	return `(action) => actionsDictionary[action];`;
}

export function getCreateActionFunc(props: { className: string }) {
	return `
		(action, payload) => {
			const actionId = ${props.className}.getAction(action);
			return {
				action: actionId,
				payload,
			}
		}`;
}

export function getActionValidator() {
	return `(a) => Object.values(actionsDictionary).includes(a)`;
}

export function getActionToStateFromState(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
}) {
	return `const actionToStateFromStateDict = {${getActionToStateFromStateDict({
		diagram: props.diagram,
		stateDictionary: props.stateDictionary,
		actionDictionary: props.actionDictionary,
	}).join('\n\t')}}`;
}

export function getRootReducer() {
	return `({ action, context, payload, state }) => {
					if (!action || payload === null) return { state, context };
					${getRootReducerStateValidation()}
					${getRootReducerActionValidation()}
					const {state:newState} = actionToStateFromStateDict[state][action]

					const contextWithInitial = getDefaultContext(context,payload)

					const newContextFunc = reducer[newState]

					if(typeof newContextFunc !== 'function') {
						throw new Error('Invalid newContextFunc')
					}
					return {state:newState, context: newContextFunc(contextWithInitial, payload, this.getFunctionRegistry())};
  				}`;
}

export function getRootReducerStateValidation() {
	return `${getRootReducerStateValidationHead()} ${getRootReducerStateValidationError()}`;
}

export function getRootReducerStateValidationHead() {
	return `if (!this.isKeyOf(state, actionToStateFromStateDict))`;
}

export function getRootReducerStateValidationError() {
	return `throw new Error("Invalid state, maybe machine isn't running.")`;
}

export function getRootReducerActionValidation() {
	return `if (!this.isKeyOf(action, actionToStateFromStateDict[state])) return { state, context };`;
}

export function getStateValidator() {
	return `(s) => Object.values(statesDictionary).includes(s)`;
}

export function getIsKeyOf() {
	return `(key, obj) => key in obj`;
}

export function getDefaultContext(props: {
	stateDictionary: BasicStateDictionary;
	diagram: TStateDiagramMatrixIncludeNotes;
	expressions: TExpressionRecord;
}) {
	const state = props.stateDictionary.getStateValues({ keys: [StartState] })[0];

	if (state) {
		const ctx = getContextTransition({
			diagram: props.diagram,
			expressions: props.expressions,
			stateDictionary: props.stateDictionary,
			value: state,
		});

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

export function getObjectKeysMap(dict: Record<any, any>) {
	const obj: Record<string, string> = {};
	Object.keys(dict).forEach((key: string) => {
		obj[key] = key;
	});
	return obj;
}

export function getActionsMap(props: {
	actionDictionary: BasicActionDictionary;
}) {
	return getObjectKeysMap(props.actionDictionary.getDictionary());
}

export function getStatesMap(props: {
	stateDictionary: BasicStateDictionary;
}) {
	return getObjectKeysMap(props.stateDictionary.getDictionary());
}

export function buildDependencyGraph(props: {
	diagram: TStateDiagramMatrixIncludeNotes;
	imports: TImports;
	dependencyGraph: TDependencyGraph;
}) {
	const defines = props.diagram.states.flatMap(state => state.notes?.defines ?? []);

	const addDependencies = (expression: TExpressionDefine<'function'>, currentFunc: string) => {
		const { FunctionName, Arguments } = expression.FunctionDeclaration;

		if (!props.imports['@yantrix/functions']) {
			props.imports['@yantrix/functions'] = [];
		}

		props.imports['@yantrix/functions'].push(FunctionName);

		if (!props.dependencyGraph.has(currentFunc)) {
			props.dependencyGraph.set(currentFunc, new Set());
		}

		props.dependencyGraph.get(currentFunc)!.add(FunctionName);

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
	return {
		imports: props.imports,
		dependencyGraph: props.dependencyGraph,
	} as const;
}
