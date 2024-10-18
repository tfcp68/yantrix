// import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
// import {
// 	ExpressionTypes,
// 	isContextWithReducer,
// 	isKeyItemReference,
// 	isKeyItemWithExpression,
// 	TContextItem,
// } from '@yantrix/yantrix-parser';
// import { TExpressionRecord, TStateDiagramMatrixIncludeNotes } from '../../../types/common';
// import { pathRecord } from '../../shared';
// import { getExpressionValue, getFunctionBody } from './expression';
// import { getReferenceString } from './shorties';
//
// export type TDictionaries = string[];
// export type TDependencyGraph = Map<string, Set<string>>;
//
// export function getDictionariesText(props: {
// 	dictionaries: TDictionaries;
// }): string {
// 	return props.dictionaries.join('\n');
// }
//
// export function setupDictionaries(props: {
// 	dependencyGraph: TDependencyGraph;
// 	diagram: TStateDiagramMatrixIncludeNotes;
// 	stateDictionary: BasicStateDictionary;
// 	actionDictionary: BasicActionDictionary;
// 	expressions: TExpressionRecord;
// }) {
// 	const dictionaries: TDictionaries = [];
// 	dictionaries.push(
// 		`export const statesDictionary = ${JSON.stringify(props.stateDictionary.getDictionary(), null, 2)}`,
// 	);
// 	dictionaries.push(
// 		`export const actionsDictionary = ${JSON.stringify(props.actionDictionary.getDictionary(), null, 2)}`,
// 	);
// 	dictionaries.push(`const reducer = {${getStateToContext({
// 		diagram: props.diagram,
// 		stateDictionary: props.stateDictionary,
// 		actionDictionary: props.actionDictionary,
// 		expressions: props.expressions,
// 	}).join(',\n\t')}}`);
// 	dictionaries.push(`export const functionDictionary = new FunctionDictionary();`);
// 	dictionaries.push(`functionDictionary.register(builtInFunctions);`);
// 	dictionaries.push();
// 	checkForCyclicDependencies({
// 		dependencyGraph: props.dependencyGraph,
// 	});
// 	registerCustomFunctions({
// 		diagram: props.diagram,
// 		expressions: props.expressions,
// 		dependencyGraph: props.dependencyGraph,
// 		dictionaries,
// 	});
// }
//
// export function getStateToContext(props: {
// 	diagram: TStateDiagramMatrixIncludeNotes;
// 	stateDictionary: BasicStateDictionary;
// 	actionDictionary: BasicActionDictionary;
// 	expressions: TExpressionRecord;
// }) {
// 	return props.diagram.states.map((state) => {
// 		const stateValue = props.stateDictionary.getStateValues({ keys: [state.id] })[0];
//
// 		if (!stateValue) {
// 			throw new Error('Invalid state');
// 		}
//
// 		return `${stateValue}: (prevContext, payload, functionDictionary) => {
//
// 				return ${getContextTransition({
// 		value: stateValue,
// 		stateDictionary: props.stateDictionary,
// 		diagram: props.diagram,
// 		expressions: props.expressions,
// 	})}
// 			}`;
// 	});
// }
//
// export function getContextTransition(props: {
// 	value: number;
// 	stateDictionary: BasicStateDictionary;
// 	diagram: TStateDiagramMatrixIncludeNotes;
// 	expressions: TExpressionRecord;
// }) {
// 	const stateFromDict = props.stateDictionary.getStateKeys({ states: [props.value] })[0];
//
// 	if (stateFromDict === null) {
// 		throw new Error(`Invalid state - ${props.value}`);
// 	}
//
// 	const diagramState = props.diagram.states.find((diagramState) => {
// 		return diagramState.id === stateFromDict;
// 	});
//
// 	if (!diagramState) {
// 		throw new Error(`Invalid state - ${props.value}`);
// 	}
//
// 	const ctxRes: string[] = [];
//
// 	diagramState.notes?.contextDescription.forEach((ctx) => {
// 		const newContext = getContextItem({
// 			ctx,
// 			expressions: props.expressions,
// 		});
//
// 		ctxRes.push(...newContext);
// 	});
//
// 	if (ctxRes.length === 0) return 'prevContext';
//
// 	return `{${ctxRes.join(',\n\t')}}`;
// };
//
// export function getContextItem(props: {
// 	ctx: TContextItem;
// 	expressions: TExpressionRecord;
// }) {
// 	if (isContextWithReducer(props.ctx)) {
// 		const { context, reducer } = props.ctx;
//
// 		return reducer
// 			.map(({ keyItem }) => {
// 				if (isKeyItemReference(keyItem)) {
// 					const { expressionType, identifier: boundIdentifier } = keyItem;
// 					const path = pathRecord[expressionType];
//
// 					if (keyItem.expressionType === ExpressionTypes.Constant) {
// 						const expressionValueRight = getExpressionValue({
// 							expression: keyItem,
// 							expressions: props.expressions,
// 						});
// 						return `(function(){
// 								return ${expressionValueRight}
// 								}())`;
// 					}
//
// 					if (isKeyItemWithExpression(keyItem)) {
// 						const { expression } = keyItem;
//
// 						const expressionValueRight = getExpressionValue({
// 							expression,
// 							expressions: props.expressions,
// 						});
//
// 						return getDefaultPropertyContext(path, boundIdentifier, expressionValueRight);
// 					} else {
// 						return getDefaultPropertyContext(path, boundIdentifier);
// 					}
// 				} else {
// 					const { expression } = keyItem;
//
// 					const expressionValueRight = getExpressionValue({
// 						expression,
// 						expressions: props.expressions,
// 					});
// 					return `(function(){
// 						return ${expressionValueRight}
// 					}())`;
// 				}
// 			})
// 			.map((el, index) => {
// 				const item = context[index];
// 				if (!item) {
// 					throw new Error('Unexcpeted index bound property');
// 				}
// 				const { keyItem } = item;
// 				const { identifier: targetProperty } = keyItem;
//
// 				if (isKeyItemWithExpression(keyItem)) {
// 					const { expression } = keyItem;
//
// 					const expressionValueRight = getExpressionValue({
// 						expression,
// 						expressions: props.expressions,
// 					});
//
// 					return `${targetProperty}: (function(){
// 						const boundValue = ${el}
// 						if(boundValue !== null){
// 							return boundValue
// 						}
// 						else {
// 							return ${expressionValueRight}
// 						}
//
// 					}())`;
// 				} else {
// 					return `${targetProperty}: (function(){
// 						const boundValue = ${el}
//
// 						return boundValue
//
// 					}())`;
// 				}
// 			});
// 	} else {
// 		const { context } = props.ctx;
// 		return context.map(({ keyItem }) => {
// 			const { identifier } = keyItem;
// 			if (isKeyItemWithExpression(keyItem)) {
// 				const expressionValue = getExpressionValue({
// 					expression: keyItem.expression,
// 					expressions: props.expressions,
// 				});
//
// 				return `${identifier}: ${getDefaultPropertyContext('prevContext', identifier, expressionValue)}`;
// 			} else {
// 				return `${identifier}: ${getDefaultPropertyContext('prevContext', identifier)}`;
// 			}
// 		});
// 	}
// };
//
// export function checkForCyclicDependencies(props: {
// 	dependencyGraph: TDependencyGraph;
// }) {
// 	const cycles = detectCycles({
// 		dependencyGraph: props.dependencyGraph,
// 	});
// 	if (cycles.length > 0) {
// 		const cycleStrings = cycles.map(cycle => cycle.join(' -> '));
// 		throw new Error(`Cyclic dependencies detected in function definitions:\n${cycleStrings.join('\n')}`);
// 	}
// }
//
// export function detectCycles(props: {
// 	dependencyGraph: TDependencyGraph;
// }): string[][] {
// 	const visited = new Set<string>();
// 	const recursionStack = new Set<string>();
// 	const cycles: string[][] = [];
//
// 	const dfs = (node: string, path: string[] = []): boolean => {
// 		if (!visited.has(node)) {
// 			visited.add(node);
// 			recursionStack.add(node);
//
// 			const neighbors = props.dependencyGraph.get(node) || new Set();
// 			for (const neighbor of neighbors) {
// 				if (!visited.has(neighbor)) {
// 					if (dfs(neighbor, [...path, node])) {
// 						return true;
// 					}
// 				} else if (recursionStack.has(neighbor)) {
// 					cycles.push([...path, node, neighbor]);
// 					return true;
// 				}
// 			}
// 		}
//
// 		recursionStack.delete(node);
// 		return false;
// 	};
//
// 	for (const node of props.dependencyGraph.keys()) {
// 		if (!visited.has(node)) {
// 			dfs(node);
// 		}
// 	}
//
// 	return cycles;
// }
//
// export function registerCustomFunction(props: {
// 	diagram: TStateDiagramMatrixIncludeNotes;
// 	dependencyGraph: TDependencyGraph;
// 	dictionaries: TDictionaries;
// 	expressions: TExpressionRecord;
// }) {
// 	const defines = props.diagram.states.flatMap(state => state.notes?.defines ?? []);
// 	const registered = new Set<string>();
//
// 	const registerFunction = (funcName: string) => {
// 		if (registered.has(funcName)) return;
//
// 		const funcDef = defines.find(def => def.identifier === funcName);
// 		if (!funcDef) return;
//
// 		const dependencies = props.dependencyGraph.get(funcName) || new Set();
// 		for (const dep of dependencies) {
// 			if (!registered.has(dep)) {
// 				registerFunction(dep);
// 			}
// 		}
//
// 		const functionBody = getFunctionBody({
// 			expressions: props.expressions,
// 			expression: funcDef.expression,
//
// 		});
// 		props.dictionaries.push(`functionDictionary.register('${funcName}', function(${funcDef.Arguments.join(', ')}) {
// 				return ${functionBody};
// 			});`);
// 		registered.add(funcName);
// 	};
//
// 	for (const funcName of props.dependencyGraph.keys()) {
// 		if (!registered.has(funcName)) {
// 			registerFunction(funcName);
// 		}
// 	}
// }
//
// export function getDefaultPropertyContext(path: string, indetifier: string, expression?: string) {
// 	const fullPath = getReferenceString(path, indetifier);
//
// 	return `(function(){
// 						if(${path} !== null && ${fullPath} !== undefined && ${fullPath} !== null) {
// 							return ${path}['${indetifier}']
// 						}
// 							else {
// 								return ${expression ?? 'null'}
// 							}
// 					}())`;
// }
//
// export function registerCustomFunctions(props: {
// 	diagram: TStateDiagramMatrixIncludeNotes;
// 	dependencyGraph: TDependencyGraph;
// 	dictionaries: TDictionaries;
// 	expressions: TExpressionRecord;
// }) {
// 	const defines = props.diagram.states.flatMap(state => state.notes?.defines ?? []);
// 	const registered = new Set<string>();
//
// 	const registerFunction = (funcName: string) => {
// 		if (registered.has(funcName)) return;
//
// 		const funcDef = defines.find(def => def.identifier === funcName);
// 		if (!funcDef) return;
//
// 		const dependencies = props.dependencyGraph.get(funcName) || new Set();
// 		for (const dep of dependencies) {
// 			if (!registered.has(dep)) {
// 				registerFunction(dep);
// 			}
// 		}
//
// 		const functionBody = getFunctionBody({
// 			expression: funcDef.expression,
// 			expressions: props.expressions,
// 		});
// 		props.dictionaries.push(`functionDictionary.register('${funcName}', function(${funcDef.Arguments.join(', ')}) {
// 				return ${functionBody};
// 			});`);
// 		registered.add(funcName);
// 	};
//
// 	for (const funcName of props.dependencyGraph.keys()) {
// 		if (!registered.has(funcName)) {
// 			registerFunction(funcName);
// 		}
// 	}
// }
