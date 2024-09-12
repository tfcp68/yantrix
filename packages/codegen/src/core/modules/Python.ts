import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import { StartState, TDiagramAction } from '@yantrix/mermaid-parser';

import { ICodegen, TGetCodeOptionsMap, TModuleParams, TStateDiagramMatrixIncludeNotes } from '../../types/common.js';
import { fillDictionaries } from '../shared.js';
import { ModuleNames } from './index';

export class PythonCodegen implements ICodegen<typeof ModuleNames.Python> {
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
	diagram: TStateDiagramMatrixIncludeNotes;
	handlersDict: string[];
	// initialContext: string;
	initialContextKeys: string[];
	changeStateHandlers: string[];
	dictionaries: string[];
	protected imports = {
		'@yantrix/automata': ['GenericAutomata'],
	};

	public getCode(options: TGetCodeOptionsMap[typeof ModuleNames.Python]): string {
		return `
			${this.getImports()}
			${this.getDictionaries()}
			${this.getDefaultContext()}
			${this.getActionToStateFromState()}
			${this.getClassTemplate(options.className)}
		`;
	}

	constructor({ diagram }: TModuleParams) {
		this.actionDictionary = new BasicActionDictionary();
		this.stateDictionary = new BasicStateDictionary();
		this.diagram = diagram;

		this.handlersDict = [];
		this.changeStateHandlers = [];
		this.dictionaries = [];
		this.initialContextKeys = [];

		// this.initialContext = this.getInitialContext();

		fillDictionaries(diagram, this.stateDictionary, this.actionDictionary);
		this.setupDictionaries();
	}

	public getImports(): string {
		// let imports = '';
		// for (const [key, value] of Object.entries(this.imports)) {
		// 	imports += `from '${key}' import ${value.join(', ')}\n`;
		// }
		// return imports;
		return '';
	}

	public getDictionaries(): string {
		return this.dictionaries.join('\n');
	}

	setupDictionaries(): void {
		this.dictionaries.push(`statesDictionary = ${JSON.stringify(this.stateDictionary.getDictionary(), null, 2)}`);
		this.dictionaries.push(`actionsDictionary = ${JSON.stringify(this.actionDictionary.getDictionary(), null, 2)}`);
	}

	getClassTemplate(className: string): string {
		const content = [
			`class ${className}:`,
			`def __init__(self):`,
			`\tself.state = ${this.getInitialState()}`,
			`\tself.context = ${{}}`,
			`\tself.root_reducer = self.rootReducer(action, context, payload, state)`,
			`${this.getRootReducer()}`,
			`${this.getIsKeyOf()}`,
			`${this.getStateValidator()}`,
			`${this.getActionValidator()}`,
		];
		return content.join('\n\t');
	}

	public getActionToStateFromState(): string {
		return `actionToStateFromStateDict = {${this.getActionToStateFromStateDict().join('\n\t')}}`;
	}

	getActionToStateDict(transitions: Record<string, TDiagramAction>): string[] {
		return Object
			.entries(transitions)
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

					// const ctx = this.getSubsyntaxContext(key);

					const context = [
						`${actionValue}: {`,
						`\t'state': ${newState},`,
						`\t'getNewContext': lambda payload, context: ${{}}`,
						`},`,
					];
					return context.join('\n');
				});
			})
			.flatMap(el => `${el.join('\n\t')}`);
	}

	protected getIsKeyOf(): string {
		const content = [`def isKeyOf(self, key, obj):`, `return key in obj`];
		return content.join('\n\t\t');
	}

	protected getRootReducer(): string {
		const content = [
			`def rootReducer(self, action, context, payload, state):`,
			`if (not action) or (payload is None):`,
			`\treturn {'state': state, 'context': context}`,
			`${this.getRootReducerStateValidation()}`,
			`${this.getRootReducerActionValidation()}`,
			`stateNew, getNewContext = actionToStateFromStateDict[state][action]`,
			`return { 'state': stateNew, 'context': getNewContext(payload, context) }`,
		];
		return content.join('\n\t\t');
	}

	protected getRootReducerStateValidation(): string {
		const context = [
			`${this.getRootReducerStateValidationHead()}`,
			`\t\t\t${this.getRootReducerStateValidationError()}`,
		];
		return context.join('\n');
	}

	protected getRootReducerStateValidationHead(): string {
		return `if not self.isKeyOf(state, actionToStateFromStateDict):`;
	}

	protected getRootReducerStateValidationError(): string {
		return `raise ValueError("Invalid state, maybe machine isn't running.")`;
	}

	protected getRootReducerActionValidation(): string {
		const content = [
			`if not self.isKeyOf(action, actionToStateFromStateDict[state]):`,
			`return {'state': state, 'context': context }`,
		];
		return content.join('\n\t\t\t');
	}

	protected getStateValidator(): string {
		const content = [`def stateValidator(self, s):`, `return s in statesDictionary.values()`];
		return content.join('\n\t\t');
	}

	protected getActionValidator(): string {
		const content = [`def actionValidator(self, a):`, `return a in actionsDictionary.values()`];
		return content.join('\n\t\t');
	}

	protected getActionToStateFromStateDict(): string[] {
		return Object.entries(this.diagram.transitions).map(([state, transitions]) => {
			const value = this.stateDictionary.getStateValues({ keys: [state] })[0];
			if (!value)
				throw new Error(`State ${state} not found`);

			return `${value}: {${this.getActionToStateDict(transitions).join('\n\t')}},`;
		});
	}

	// protected getSubsyntaxContext(state: string | null) {
	// 	const value = this.diagram.states.find((diagramState) => {
	// 		return diagramState.id === state;
	// 	});

	// 	if (!value) {
	// 		throw new Error(`Invalid state - ${value}`);
	// 	}

	// 	if (!value.notes || !value.notes.contextDescription.length) {
	// 		return `prevContext`;
	// 	}
	// 	const { contextDescription } = value.notes;

	// 	const flattedContext = contextDescription.flatMap((e) => e.context.flatMap((e) => e));

	// 	const unusedInitialKeys = this.initialContextKeys.filter(
	// 		(key) => flattedContext.filter((e) => e.KeyItemDeclaration.TargetProperty === key).length === 0,
	// 	);

	// 	const normalizedUnusedKeys = unusedInitialKeys.map((property) => {
	// 		return `'${property}': ${TAssignTypeDict.PREV_CONTEXT}['${property}'],`;
	// 	});

	// 	const res = contextDescription
	// 		.map((ctx) => {
	// 			if (isPayloadContext(ctx)) {
	// 				const { context, payload = [] } = ctx;
	// 				return context.map((ctxItem, index) => {
	// 					const boundProperty = payload[index] || null;
	// 					return this.getContextValues(ctxItem, boundProperty, TAssignTypeDict.PAYLOAD);
	// 				});
	// 			} else if (isPrevContext(ctx)) {
	// 				const { context, prevContext = [] } = ctx;
	// 				return context.map((ctxItem, index) => {
	// 					const boundProperty = prevContext[index] || null;
	// 					return this.getContextValues(ctxItem, boundProperty, TAssignTypeDict.PREV_CONTEXT);
	// 				});
	// 			} else if (isShortContext(ctx)) {
	// 				const { context } = ctx;
	// 				return context.map((ctxItem) => {
	// 					return this.getContextValues(ctxItem, null, TAssignTypeDict.PREV_CONTEXT);
	// 				});
	// 			}
	// 			throw new Error(`Invalid context type - ${ctx}`);
	// 		})
	// 		.flatMap((template) => template.flatMap((el) => el));

	// 	return `{${[...normalizedUnusedKeys, ...res].join('\r\n')}}`;
	// }

	// private getInitialContext() {
	// 	const startState = this.diagram.states.find((state) => {
	// 		return state.id === StartState;
	// 	});

	// 	if (!startState?.notes) {
	// 		return 'null';
	// 	}

	// 	const initialNotes = startState.notes.contextDescription.map((ctx) => {
	// 		const { context } = ctx;
	// 		return context
	// 			.map((ctx) => {
	// 				this.initialContextKeys.push(ctx.KeyItemDeclaration.TargetProperty);

	// 				if (isKeyItemWithExpression(ctx)) {
	// 					return `${ctx.KeyItemDeclaration.TargetProperty}: ${this.getByExpressionValue(ctx)}`;
	// 				}
	// 				return `${ctx.KeyItemDeclaration.TargetProperty}: null`;
	// 			})
	// 			.flatMap((el) => el);
	// 	});

	// 	return `{${initialNotes.join(',\n\t')}}`;
	// }

	public getDefaultContext(): string {
		const context = [
			`def getDefaultContext(payload, prevContext):`,
			// `\tinitialContext = ${this.getSubsyntaxContext(StartState)}`,
			`\treturn {**initialContext, **prevContext}`,
		];

		return context.join('\n');
	}

	private getInitialState(): number | null | undefined {
		return this.stateDictionary.getStateValues({ keys: [StartState] })[0];
	}

	// private getContextValues(context: TKeyItem, boundProperty: TKeyItem | null, type: TAssignTypes) {
	// 	const { TargetProperty: LeftTarget } = context.KeyItemDeclaration;

	// 	if (boundProperty === null) {
	// 		if (isKeyItemWithExpression(context)) {
	// 			const value = this.getByExpressionValue(context);
	// 			return `'${LeftTarget}': ${TAssignTypeDict.PREV_CONTEXT}['${LeftTarget}'] || ${value},`;
	// 		}
	// 		return `'${LeftTarget}': ${TAssignTypeDict.PREV_CONTEXT}['${LeftTarget}'],`;
	// 	}

	// 	const { TargetProperty: RightTarget } = boundProperty.KeyItemDeclaration;
	// 	const isEmptyInitial = !isKeyItemWithExpression(context);

	// 	const isEmptyBoundExpression = !isKeyItemWithExpression(boundProperty);

	// 	if (isEmptyBoundExpression && isEmptyInitial) {
	// 		return `
	// 			'${LeftTarget}' : ${type}['${RightTarget}'] || null,
	// 		`;
	// 	}

	// 	//	#{ selectedIndex = 3 } <= (index ) || { selectedIndex }
	// 	if (isEmptyBoundExpression && !isEmptyInitial) {
	// 		if (isKeyItemWithExpression(context)) {
	// 			const value = this.getByExpressionValue(context);

	// 			return `'${LeftTarget}':  ${type}['${RightTarget}'] || ${value},`;
	// 		}
	// 	}
	// 	//	#{ selectedIndex } <= (index=3)
	// 	if (!isEmptyBoundExpression && isEmptyInitial) {
	// 		if (isKeyItemWithExpression(boundProperty)) {
	// 			const value = this.getByExpressionValue(boundProperty);

	// 			return `'${LeftTarget}': ${type}['${RightTarget}'] || ${value},`;
	// 		}
	// 	}
	// 	if (isKeyItemWithExpression(boundProperty) && isKeyItemWithExpression(context)) {
	// 		const leftValue = this.getByExpressionValue(context);
	// 		const rightValue = this.getByExpressionValue(boundProperty);

	// 		return `'${LeftTarget}': ${type}['${RightTarget}'] || ${rightValue} || ${leftValue},`;
	// 	}
	// 	return `'${LeftTarget}': null,`;
	// }

	// private getByExpressionValue<T extends TMappedKeys>({
	// 	KeyItemDeclaration: { Expression },
	// }: TKeyItemWithExpression<T>) {
	// 	return Expressions[Expression.expressionType](Expression);
	// }
}
