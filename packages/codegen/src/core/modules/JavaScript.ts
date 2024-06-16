import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import { StartState, TDiagramAction } from '@yantrix/mermaid-parser';
import { fillDictionaries } from '../shared.js';
import { ICodegen, TAssignTypeDict, TAssignTypes, TStateDiagramMatrixIncludeNotes } from '../../types/common.js';
import { convertKeysToNumberString } from '../../utils/utils.js';
import {
	isKeyItemWithExpression,
	isPayloadContext,
	isPrevContext,
	TKeyItem,
	TKeyItemWithExpression,
} from '@yantrix/yantrix-parser';

export class JavaScriptCodegen implements ICodegen {
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
	diagram: TStateDiagramMatrixIncludeNotes;
	handlersDict: string[];
	changeStateHandlers: string[];
	dictionaries: string[];
	protected imports = {
		'@yantrix/automata': ['GenericAutomata'],
	};

	constructor(diagram: TStateDiagramMatrixIncludeNotes) {
		this.actionDictionary = new BasicActionDictionary();
		this.stateDictionary = new BasicStateDictionary();
		this.diagram = diagram;

		this.handlersDict = [];
		this.changeStateHandlers = [];
		this.dictionaries = [];

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

	public getChangeStateHandlers(): string {
		return this.changeStateHandlers.join('\n');
	}

	setupDictionaries() {
		this.dictionaries.push(
			`export const statesDictionary = ${JSON.stringify(this.stateDictionary.getDictionary(), null, 2)}`,
		);
		this.dictionaries.push(
			`export const actionsDictionary = ${JSON.stringify(this.actionDictionary.getDictionary(), null, 2)}`,
		);
	}

	getClassTemplate(className: string) {
		return `export class ${className} extends GenericAutomata {
  		 constructor() {
  			super();
  			this.init({
  				state: ${this.getInitialState()},
  				context: ${this.getInitialContext()},
                rootReducer: ${this.getRootReducer()},
  				stateValidator: ${this.getStateValidator()},
  				actionValidator: ${this.getActionValidator()},
				});
			}
			isKeyOf = ${this.getIsKeyOf()};
		}`;
	}

	public getActionToStateFromState() {
		return `const actionToStateFromStateDict = ${convertKeysToNumberString(this.getActionToStateFromStateDict())}`;
	}

	getActionToStateDict(transitions: Record<string, TDiagramAction>) {
		const actionToStateDict: Record<number, number> = {};
		Object.keys(transitions).map((key) => {
			const { actionsPath } = transitions[key];
			const newState = this.stateDictionary.getStateValues({ keys: [key] })[0];
			actionsPath.map(({ action }) => {
				const actionValue = this.actionDictionary.getActionValues({
					keys: action,
				})[0];
				if (!actionValue) throw new Error(`Action ${action} not found`);
				if (!newState) throw new Error(`State ${key} not found`);
				actionToStateDict[actionValue] = newState;
			});
		});
		return actionToStateDict;
	}

	protected getIsKeyOf() {
		return `(key, obj) => key in obj`;
	}

	protected getRootReducer() {
		return `({ action, context, payload, state }) => {
					if (!action || payload === null) return { state, context };
					${this.getRootReducerStateValidation()}
					${this.getRootReducerActionValidation()}
					const newState = actionToStateFromStateDict[state][action] ?? state;
					return {state:  newState, context: { ...payload }};
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
		const actionToStateFromStateDict: Record<number, Record<number, number>> = {};
		Object.keys(this.diagram.transitions).map((state) => {
			const transitions = this.diagram.transitions[state];
			const value = this.stateDictionary.getStateValues({ keys: [state] })[0];
			if (!value) throw new Error(`State ${state} not found`);
			actionToStateFromStateDict[value] = this.getActionToStateDict(transitions);
		});
		return actionToStateFromStateDict;
	}

	protected getHandleStateChangeDeclaration(value: number, body: string) {
		return `const handleStateChange${value} = ({payload,action,context:${TAssignTypeDict.PREV_CONTEXT},state}) => {${body}}`;
	}

	protected getSubsyntaxContext(state: string | null) {
		const value = this.diagram.states.find((diagramState) => {
			return diagramState.id === state;
		});

		if (!value) {
			throw new Error(`Invalid state - ${value}`);
		}

		if (!value.notes || !value.notes.contextDescription.length) {
			return `...prevContext`;
		}

		const { contextDescription } = value.notes;

		const res = contextDescription
			.map((ctx) => {
				return ctx.context.map(() => {
					if (isPayloadContext(ctx)) {
						const { context, payload = [] } = ctx;
						return context.map((ctxItem, index) => {
							const boundProperty = payload[index] || null;
							return this.getContextValues(ctxItem, boundProperty, TAssignTypeDict.PAYLOAD);
						});
					}
					if (isPrevContext(ctx)) {
						const { context, prevContext = [] } = ctx;
						return context.map((ctxItem, index) => {
							const boundProperty = prevContext[index] || null;
							return this.getContextValues(ctxItem, boundProperty, TAssignTypeDict.PREV_CONTEXT);
						});
					}
					const { context } = ctx;
					return context.map((ctxItem) => {
						return this.getContextValues(ctxItem, null, TAssignTypeDict.PREV_CONTEXT);
					});
				});
			})
			.flatMap((template) => template.flatMap((el) => el));

		return ['...prevContext,', ...res].join('\r\n');
	}

	private getInitialContext() {
		const startState = this.diagram.states.find((state) => {
			return state.id === StartState;
		});

		if (!startState?.notes) {
			return 'null';
		}

		const initialNotes = startState.notes.contextDescription
			.map((ctx) => {
				if (isPrevContext(ctx) || isPrevContext(ctx)) {
					return null;
				} else {
					const { context } = ctx;
					return context
						.map((ctx) => {
							return this.getInitialValue(ctx);
						})
						.flatMap((el) => el);
				}
			})
			.filter((el) => el !== null);

		return `{${initialNotes.join(',')}}`;
	}

	private getInitialState() {
		return this.stateDictionary.getStateValues({ keys: [StartState] })[0];
	}

	private getInitialValue(context: TKeyItem) {
		if (isKeyItemWithExpression(context)) {
			const {
				KeyItemDeclaration: { TargetProperty },
			} = context;
			return `${TargetProperty}: ${this.getByExpressionValue(context)}`;
		} else {
			const {
				KeyItemDeclaration: { TargetProperty },
			} = context;
			return `${TargetProperty}: null`;
		}
	}

	private getContextValues(context: TKeyItem, boundProperty: TKeyItem | null, type: TAssignTypes) {
		const { TargetProperty: LeftTarget } = context.KeyItemDeclaration;

		if (boundProperty === null) {
			if (isKeyItemWithExpression(context)) {
				const value = this.getByExpressionValue(context);
				return `${LeftTarget}:  ${value},`;
			}
			return `${LeftTarget}: ${TAssignTypeDict.PREV_CONTEXT}['${LeftTarget}'],`;
		}

		const { TargetProperty: RightTarget } = boundProperty.KeyItemDeclaration;
		const isEmptyInitial = !isKeyItemWithExpression(context);

		const isEmptyBoundExpression = !isKeyItemWithExpression(boundProperty);

		if (isEmptyBoundExpression && isEmptyInitial) {
			return `
				${LeftTarget} : ${type}['${RightTarget}'],
			`;
		}

		//	#{ selectedIndex = 3 } <= (index ) || { selectedIndex }
		if (isEmptyBoundExpression && !isEmptyInitial) {
			if (isKeyItemWithExpression(context)) {
				const value = this.getByExpressionValue(context);

				return `${LeftTarget}:  ${type}['${RightTarget}'] || ${value},`;
			}
		}
		//	#{ selectedIndex } <= (index=3)
		if (!isEmptyBoundExpression && isEmptyInitial) {
			if (isKeyItemWithExpression(boundProperty)) {
				const value = this.getByExpressionValue(boundProperty);

				return `${LeftTarget}: ${type}['${RightTarget}'] || ${value},`;
			}
		}
		if (isKeyItemWithExpression(boundProperty) && isKeyItemWithExpression(context)) {
			const leftValue = this.getByExpressionValue(context);
			const rightValue = this.getByExpressionValue(context);

			return `${LeftTarget}: ${type}['${RightTarget}'] || ${rightValue} || ${leftValue},`;
		}
		return `${LeftTarget}: null,`;
	}

	private getByExpressionValue({
		KeyItemDeclaration: {
			Expression: { expressionType, value },
		},
	}: TKeyItemWithExpression) {
		// @ts-expect-error - idk
		return Expressions[expressionType](value);
	}
}
