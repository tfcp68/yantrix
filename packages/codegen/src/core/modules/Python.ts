import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BasicActionDictionary, BasicEventDictionary, BasicStateDictionary } from '@yantrix/automata';
import { StartState } from '@yantrix/mermaid-parser';
import {
	ContextStatement,
	DataObject,
	defineExpressionIsFunction,
	DefineFunction,
	FunctionCall,
	getContextStatements,
	getDefineStatements,
	getFunctionArgs,
	getFunctionName,
	getNumberValue,
	getReferenceIdentifier,
	getReferenceType,
	getStringValue,
	hasInitialState,
	hasReducer,
	isConstant,
	isDataObject,
	isFunctionCall,
	KeyItem,
	MAX_NESTED_FUNC_LEVEL,
	NumberLiteral,
	RawKeyItem,
	StringLiteral,
} from '@yantrix/yantrix-parser';
import { ByPassAction } from '../../constants.js';
import { ICodegen, TConstants, TExpressionRecord, TGetCodeOptionsMap, TModuleParams, TStateDiagramMatrixIncludeNotes } from '../../types/common.js';
import { eta, etaViewsPath } from '../eta.js';
import { fillDictionaries, getStatesByPass } from '../shared.js';
import { ModuleNames } from './index.js';
import { getExpressionValue } from './JavaScript/JavaScriptCompiler/expressions/core.js';
import { getPredicates } from './JavaScript/JavaScriptCompiler/forks/core.js';

const pythonPathRecord: Record<string, string> = {
	constant: 'constant',
	context: 'prev_context',
	payload: 'payload',
};

const YANTRIX_TO_PYTHON: Record<string, string> = {
	if: '_if',
	case: '_case',
	coalesce: 'coalesce',
	and: 'and_',
	or: 'or_',
	none: 'none',
	not: 'not_',
	isGreater: 'is_greater',
	isGreaterOrEqual: 'is_greater_or_equal',
	isLess: 'is_less',
	isLessOrEqual: 'is_less_or_equal',
	isEven: 'is_even',
	isOdd: 'is_odd',
	isInteger: 'is_integer',
	isNegative: 'is_negative',
	isPositive: 'is_positive',
	isNull: 'is_none',
	isEqual: 'is_equal',
	has: 'has',
	add: 'add',
	diff: 'diff',
	mult: 'mult',
	div: 'div',
	pow: 'pow_',
	inc: 'inc',
	dec: 'dec',
	neg: 'neg',
	inv: 'inv',
	mod: 'mod',
	trunc: 'trunc',
	ceil: 'ceil',
	round: 'round_',
	sin: 'sin',
	cos: 'cos',
	sqrt: 'sqrt',
	log: 'log',
	ln: 'ln',
	lg: 'lg',
	deg: 'deg',
	rad: 'rad',
	len: 'len_',
	left: 'left',
	right: 'right',
	indexOf: 'index_of',
	reverse: 'reverse',
	sort: 'sort',
	lookup: 'lookup',
	repeat: 'repeat',
	substr: 'substr',
	pluck: 'pluck',
	filterBy: 'filter_by',
	_random: '_random',
};

// ---------------------------------------------------------------------------
// Expression-level serializers (produce Python expression strings)
// ---------------------------------------------------------------------------

function pyNull(path: string, identifier: string, fallback: string | null): string {
	const val = `${path}.get('${identifier}')`;
	const check = `${path} is not None and ${path}.get('${identifier}') is not None`;
	return `(${val} if ${check} else ${fallback ?? 'None'})`;
}

function pyFuncCall(name: string, args: string[]): string {
	const pyName = YANTRIX_TO_PYTHON[name] ?? name;
	return `function_dictionary['${pyName}'](${args.join(', ')})`;
}

function setupPythonExpressions(constants: TConstants | null): TExpressionRecord {
	const expressionRecord: TExpressionRecord = {
		array: () => '[]',
		constant: (expr: DataObject) => {
			if (constants === null) throw new Error('Missing constants');
			const id = getReferenceIdentifier(expr);
			if (constants[id] === undefined) throw new Error(`Missing constant: ${id}`);
			if (typeof constants[id] === 'string') return `'${constants[id]}'`;
			return `${constants[id]}`;
		},
		function: () => 'None',
		decimal: (expr: NumberLiteral) => `${getNumberValue(expr)}`,
		integer: (expr: NumberLiteral) => `${getNumberValue(expr)}`,
		string: (expr: StringLiteral) => `'${getStringValue(expr)}'`,
		context: (expr: DataObject) => pyNull('prev_context', getReferenceIdentifier(expr), null),
		payload: (expr: DataObject) => pyNull('payload', getReferenceIdentifier(expr), null),
	};

	expressionRecord.function = (func: FunctionCall) => {
		let level = 0;
		const recursive = (func: FunctionCall): string => {
			const name = getFunctionName(func);
			const args = getFunctionArgs(func);
			const res: string[] = [];
			if (level >= MAX_NESTED_FUNC_LEVEL) throw new Error(`Max nested func level reached`);
			args.forEach((item: KeyItem) => {
				if (isDataObject(item)) {
					const refType = getReferenceType(item);
					const identifier = getReferenceIdentifier(item);
					const path = pythonPathRecord[refType];
					if (!path) throw new Error(`Unknown ref type: ${refType}`);
					if (item.assignedExpression) {
						if (isFunctionCall(item.assignedExpression)) {
							level++;
							res.push(recursive(item.assignedExpression));
							return;
						}
						const fallback = getExpressionValue({ expressionRecord, expression: item.assignedExpression });
						res.push(pyNull(path, identifier, fallback));
					} else {
						if (isConstant(item.reference)) {
							res.push(getExpressionValue({ expressionRecord, expression: item }));
						} else {
							res.push(pyNull(path, identifier, null));
						}
					}
				} else if (isFunctionCall(item)) {
					res.push(recursive(item));
				} else {
					res.push(getExpressionValue({ expressionRecord, expression: item }));
				}
			});
			return pyFuncCall(name, res);
		};
		return recursive(func);
	};

	return expressionRecord;
}

function renderContextItem(item: RawKeyItem, expressions: TExpressionRecord): string {
	const { identifier, defaultValue } = item;
	if (defaultValue) {
		const fallback = getExpressionValue({ expressionRecord: expressions, expression: defaultValue });
		return `    _result['${identifier}'] = ${pyNull('prev_context', identifier, fallback)}`;
	}
	return `    _result['${identifier}'] = ${pyNull('prev_context', identifier, null)}`;
}

function renderBoundValue(
	source: string,
	target: string,
	defaultVal: string | null,
	indent: string,
): string[] {
	const lines: string[] = [];
	lines.push(`${indent}_bound_${target.replace(/\W/g, '_')} = ${source}`);
	const ref = `_bound_${target.replace(/\W/g, '_')}`;
	if (defaultVal != null) {
		lines.push(`${indent}_result['${target}'] = ${ref} if ${ref} is not None else ${defaultVal}`);
	} else {
		lines.push(`${indent}_result['${target}'] = ${ref}`);
	}
	return lines;
}

function renderContextStatement(ctx: ContextStatement, expressions: TExpressionRecord, indent: string): string[] {
	const lines: string[] = [];
	if (hasReducer(ctx)) {
		const { items, reducer } = ctx;
		reducer.forEach((keyItem, index) => {
			const item = items[index];
			if (!item) throw new Error('Unexpected index');
			const target = item.identifier;
			const defaultVal = item.defaultValue
				? getExpressionValue({ expressionRecord: expressions, expression: item.defaultValue })
				: null;

			let sourceExpr: string;
			if (isDataObject(keyItem)) {
				const refType = getReferenceType(keyItem);
				const id = getReferenceIdentifier(keyItem);
				if (!refType || !id) throw new Error(`Invalid reference in context`);
				const path = pythonPathRecord[refType];
				if (!path) throw new Error(`Unknown ref type: ${refType}`);
				if (isConstant(keyItem.reference)) {
					sourceExpr = getExpressionValue({ expressionRecord: expressions, expression: keyItem });
				} else if (keyItem.assignedExpression) {
					const fallback = getExpressionValue({ expressionRecord: expressions, expression: keyItem.assignedExpression });
					sourceExpr = pyNull(path, id, fallback);
				} else {
					sourceExpr = pyNull(path, id, null);
				}
			} else {
				sourceExpr = getExpressionValue({ expressionRecord: expressions, expression: keyItem });
			}

			lines.push(...renderBoundValue(sourceExpr, target, defaultVal, indent));
		});
	} else {
		for (const item of ctx.items) {
			lines.push(renderContextItem(item, expressions));
		}
	}
	return lines;
}

// ---------------------------------------------------------------------------
// Helpers shared across data builders
// ---------------------------------------------------------------------------

function getInitialState(diagram: TStateDiagramMatrixIncludeNotes): string {
	const found = diagram.states.find(s => s.notes && hasInitialState(s.notes));
	if (found) return found.id;
	const first = diagram.states[0]?.id;
	if (!first) throw new Error('Invalid state');
	return first;
}

function getInitialContextShape(diagram: TStateDiagramMatrixIncludeNotes, stateName: string): Record<string, null> {
	const states = diagram.states.filter(s => s.id === stateName);
	if (!states.length) return {};
	return states.reduce((acc, curr) => {
		if (!curr.notes) return acc;
		const ctxStatements = getContextStatements(curr.notes);
		ctxStatements.forEach((ctx) => {
			ctx.items.forEach((item) => {
				acc[item.identifier] = null;
			});
		});
		return acc;
	}, {} as Record<string, null>);
}

function camelToSnake(name: string): string {
	return name.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
}

// ---------------------------------------------------------------------------
// Data extraction functions (block-level generation moved to templates)
// ---------------------------------------------------------------------------

function buildReducerModelData(
	diagram: TStateDiagramMatrixIncludeNotes,
	stateDictionary: BasicStateDictionary,
	expressions: TExpressionRecord,
): Array<{ stateValue: number; bodyLines: string[] }> {
	return diagram.states.map((state) => {
		const sv = stateDictionary.getStateValues({ keys: [state.id] })[0];
		if (sv == null) throw new Error(`State not found: ${state.id}`);
		const bodyLines: string[] = [];
		if (state.notes) {
			const ctxStatements = getContextStatements(state.notes);
			for (const ctx of ctxStatements) {
				bodyLines.push(...renderContextStatement(ctx, expressions, '    '));
			}
		}
		return { stateValue: sv, bodyLines };
	});
}

function buildTransitionData(
	diagram: TStateDiagramMatrixIncludeNotes,
	stateDictionary: BasicStateDictionary,
	actionDictionary: BasicActionDictionary,
): Array<{ fromStateValue: number; actions: Array<{ actionValue: number; targetStateValues: number[] }> }> {
	const actionToStartStateMatrix: Record<string, { actionsPath: { action: string[]; note: string[][] }[] }> = {};
	Object.entries(diagram.transitions).forEach(([fromState, toStates]) => {
		if (fromState === StartState) {
			Object.entries(toStates).forEach(([targetState, action]) => {
				action.actionsPath.forEach(({ action: act }) => {
					actionToStartStateMatrix[targetState] = { actionsPath: [{ action: act, note: [] }] };
				});
			});
		}
	});

	const result: Array<{ fromStateValue: number; actions: Array<{ actionValue: number; targetStateValues: number[] }> }> = [];

	Object.entries(diagram.transitions).forEach(([fromState, toStates]) => {
		const fromStateValue = stateDictionary.getStateValues({ keys: [fromState] })[0];
		if (fromStateValue == null) return;

		const merged = { ...toStates };
		for (const [targetState, startAction] of Object.entries(actionToStartStateMatrix)) {
			if (merged[targetState]) {
				merged[targetState] = {
					actionsPath: [...merged[targetState]!.actionsPath, ...startAction.actionsPath],
				};
			} else {
				merged[targetState] = startAction;
			}
		}

		const actionMap: Record<number, number[]> = {};
		Object.entries(merged).forEach(([targetState, action]) => {
			const targetValue = stateDictionary.getStateValues({ keys: [targetState] })[0];
			if (targetValue == null) return;
			action.actionsPath.forEach(({ action: act }) => {
				const actionValue = actionDictionary.getActionValues({ keys: act })[0];
				if (actionValue == null) return;
				if (!actionMap[actionValue]) actionMap[actionValue] = [];
				if (!actionMap[actionValue]!.includes(targetValue)) actionMap[actionValue]!.push(targetValue);
			});
		});

		result.push({
			fromStateValue,
			actions: Object.entries(actionMap).map(([actionValue, states]) => ({
				actionValue: Number(actionValue),
				targetStateValues: states,
			})),
		});
	});

	return result;
}

function buildDefaultContextLines(
	startStateValue: number | null,
	diagram: TStateDiagramMatrixIncludeNotes,
	expressions: TExpressionRecord,
): string[] {
	if (startStateValue == null) return [];
	const startKey = diagram.states.find(s => s.id === StartState);
	if (!startKey?.notes) return [];
	const ctxStatements = getContextStatements(startKey.notes);
	if (ctxStatements.length === 0) return [];
	const lines: string[] = [];
	for (const ctx of ctxStatements) {
		lines.push(...renderContextStatement(ctx, expressions, '    '));
	}
	return lines;
}

function renderDefineBody(expr: any, expressions: TExpressionRecord): string {
	if (defineExpressionIsFunction(expr)) {
		const fn = expr as DefineFunction;
		const pyFn = YANTRIX_TO_PYTHON[fn.name] ?? fn.name;
		const args = fn.args.map((a: any) => renderDefineBody(a, expressions)).join(', ');
		return `function_dictionary['${pyFn}'](${args})`;
	}
	if ('identifier' in expr && !('$type' in expr && (expr as any).$type !== 'IdentifierRef')) {
		return (expr as { identifier: string }).identifier;
	}
	return getExpressionValue({ expressionRecord: expressions, expression: expr as any });
}

function buildDefinesData(
	diagram: TStateDiagramMatrixIncludeNotes,
	expressions: TExpressionRecord,
): Array<{ identifier: string; args: string[]; body: string }> {
	const defines = diagram.states.flatMap(s => s.notes ? getDefineStatements(s.notes) : []);
	const registered = new Set<string>();
	const result: Array<{ identifier: string; args: string[]; body: string }> = [];
	for (const def of defines) {
		if (registered.has(def.identifier)) continue;
		registered.add(def.identifier);
		result.push({
			identifier: def.identifier,
			args: def.args,
			body: renderDefineBody(def.expression, expressions),
		});
	}
	return result;
}

// ---------------------------------------------------------------------------
// Codegen class
// ---------------------------------------------------------------------------

export class PythonCodegen implements ICodegen<typeof ModuleNames.Python> {
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
	eventDictionary: BasicEventDictionary;
	diagram: TStateDiagramMatrixIncludeNotes;
	constants: TConstants | null;
	expressions: TExpressionRecord;
	private injectedFunctionPath: string | null;

	constructor({ diagram, constants, injectedFunctions }: TModuleParams) {
		this.stateDictionary = new BasicStateDictionary();
		this.actionDictionary = new BasicActionDictionary();
		this.eventDictionary = new BasicEventDictionary();
		this.diagram = diagram;
		this.constants = constants;
		this.expressions = setupPythonExpressions(constants);
		this.injectedFunctionPath = injectedFunctions.path ?? null;
		fillDictionaries(diagram, this.stateDictionary, this.actionDictionary, this.eventDictionary);
	}

	private buildTemplateModel(className: string) {
		const initialStateId = getInitialState(this.diagram);
		const initialStateValue = this.stateDictionary.getStateValues({ keys: [initialStateId] })[0];
		if (initialStateValue == null) throw new Error('Invalid initial state');

		const startCtx = getInitialContextShape(this.diagram, StartState);
		const initialCtxForState = getInitialContextShape(this.diagram, initialStateId);
		const initialContext = { ...startCtx, ...initialCtxForState };

		const startStateValue = this.stateDictionary.getStateValues({ keys: [StartState] })[0] ?? null;

		const builtins = readFileSync(resolve(etaViewsPath, 'python/runtime/builtins.py.tpl'), 'utf8');
		const injectedCode = this.injectedFunctionPath
			? readFileSync(this.injectedFunctionPath, 'utf8')
			: null;

		const byPassedList = getStatesByPass(this.diagram, this.stateDictionary);
		const predicates = getPredicates({
			diagram: this.diagram,
			stateDictionary: this.stateDictionary,
			actionDictionary: this.actionDictionary,
			expressions: this.expressions,
		});

		return {
			className,
			initialStateValue,
			stateDictionary: this.stateDictionary,
			actionDictionary: this.actionDictionary,
			eventDictionary: this.eventDictionary,
			python: {
				builtins,
				functionDict: Object.entries(YANTRIX_TO_PYTHON).map(([key, pyName]) => ({ key, pyName })),
				snakeName: `create_${camelToSnake(className)}`,
				initialContext,
				reducers: buildReducerModelData(this.diagram, this.stateDictionary, this.expressions),
				transitions: buildTransitionData(this.diagram, this.stateDictionary, this.actionDictionary),
				defaultContextLines: buildDefaultContextLines(startStateValue, this.diagram, this.expressions),
				defines: buildDefinesData(this.diagram, this.expressions),
				injectedCode,
				byPassedList,
				byPassActionValue: this.actionDictionary.getActionValues({ keys: [ByPassAction] })[0] ?? 0,
				predicates,
			},
		};
	}

	public getCode(options: TGetCodeOptionsMap[typeof ModuleNames.Python]): string {
		const it = this.buildTemplateModel(options.className);
		const rendered = eta.render('python/module.eta', it);
		if (rendered == null) throw new Error('Eta render returned null/undefined for python/module');
		return rendered;
	}
}
