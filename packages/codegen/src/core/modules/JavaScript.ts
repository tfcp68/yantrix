import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import { StartState, TDiagramAction } from '@yantrix/mermaid-parser';
import { Expressions, fillDictionaries } from '../shared.js';
import { ICodegen, TAssignTypeDict, TAssignTypes, TStateDiagramMatrixIncludeNotes } from '../../types/common.js';
import {
	isKeyItemWithExpression,
	isPayloadContext,
	isPrevContext,
	isShortContext,
	TKeyItem,
	TKeyItemWithExpression,
	TMappedKeys,
} from '@yantrix/yantrix-parser';

export class JavaScriptCodegen implements ICodegen {
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
	diagram: TStateDiagramMatrixIncludeNotes;
	handlersDict: string[];
	initialContext: string;
	initialContextKeys: string[];
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
		this.initialContextKeys = [];

		this.initialContext = this.getInitialContext();

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
	}

	getClassTemplate(className: string) {
		return `export class ${className} extends GenericAutomata {
  		 constructor() {
  			super();
  			this.init({
  				state: ${this.getInitialState()},
  				context: ${this.initialContext},
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

					const ctx = this.getSubsyntaxContext(key);

					return `
				  ${actionValue}: {
				  	state: ${newState},
				  	getNewContext: ({payload, context}) => {
				  			const prevContext = getDefaultContext({payload,context})
				  			return ${ctx}
				  	}
				  },
				`;
				});
			})
			.flatMap((el) => `${el.join('\n\t')}`);
	}

	protected getIsKeyOf() {
		return `(key, obj) => key in obj`;
	}

	protected getRootReducer() {
		return `({ action, context, payload, state }) => {
					if (!action || payload === null) return { state, context };
					${this.getRootReducerStateValidation()}
					${this.getRootReducerActionValidation()}
					const {state:newState,getNewContext} = actionToStateFromStateDict[state][action]
					
							
					return {state:newState, context: getNewContext({payload,context})};
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

	protected getSubsyntaxContext(state: string | null) {
		const value = this.diagram.states.find((diagramState) => {
			return diagramState.id === state;
		});

		if (!value) {
			throw new Error(`Invalid state - ${value}`);
		}

		if (!value.notes || !value.notes.contextDescription.length) {
			return `prevContext`;
		}
		const { contextDescription } = value.notes;

		const flattedContext = contextDescription.flatMap((e) => e.context.flatMap((e) => e));

		const unusedInitialKeys = this.initialContextKeys.filter(
			(key) => flattedContext.filter((e) => e.KeyItemDeclaration.TargetProperty === key).length === 0,
		);

		const normalizedUnusedKeys = unusedInitialKeys.map((property) => {
			return `${property}: ${TAssignTypeDict.PREV_CONTEXT}['${property}'],`;
		});

		const res = contextDescription
			.map((ctx) => {
				if (isPayloadContext(ctx)) {
					const { context, payload = [] } = ctx;
					return context.map((ctxItem, index) => {
						const boundProperty = payload[index] || null;
						return this.getContextValues(ctxItem, boundProperty, TAssignTypeDict.PAYLOAD);
					});
				} else if (isPrevContext(ctx)) {
					const { context, prevContext = [] } = ctx;
					return context.map((ctxItem, index) => {
						const boundProperty = prevContext[index] || null;
						return this.getContextValues(ctxItem, boundProperty, TAssignTypeDict.PREV_CONTEXT);
					});
				} else if (isShortContext(ctx)) {
					const { context } = ctx;
					return context.map((ctxItem) => {
						return this.getContextValues(ctxItem, null, TAssignTypeDict.PREV_CONTEXT);
					});
				}
				throw new Error(`Invalid context type - ${ctx}`);
			})
			.flatMap((template) => template.flatMap((el) => el));

		return `{${[...normalizedUnusedKeys, ...res].join('\r\n')}}`;
	}

	private getInitialContext() {
		const startState = this.diagram.states.find((state) => {
			return state.id === StartState;
		});

		if (!startState?.notes) {
			return 'null';
		}

		const initialNotes = startState.notes.contextDescription.map((ctx) => {
			const { context } = ctx;
			return context
				.map((ctx) => {
					this.initialContextKeys.push(ctx.KeyItemDeclaration.TargetProperty);

					if (isKeyItemWithExpression(ctx)) {
						return `${ctx.KeyItemDeclaration.TargetProperty}: ${this.getByExpressionValue(ctx)}`;
					}
					return `${ctx.KeyItemDeclaration.TargetProperty}: null`;
				})
				.flatMap((el) => el);
		});

		return `{${initialNotes.join(',\n\t')}}`;
	}

	public getDefaultContext = () => {
		return `const getDefaultContext = ({payload,context:prevContext}) => {
			const initialContext = ${this.getSubsyntaxContext(StartState)}
			return {
				...initialContext,
				...prevContext
			}
		}`;
	};
	private getInitialState() {
		return this.stateDictionary.getStateValues({ keys: [StartState] })[0];
	}

	private getContextValues(context: TKeyItem, boundProperty: TKeyItem | null, type: TAssignTypes) {
		const { TargetProperty: LeftTarget } = context.KeyItemDeclaration;

		if (boundProperty === null) {
			if (isKeyItemWithExpression(context)) {
				const value = this.getByExpressionValue(context);
				return `${LeftTarget}: ${TAssignTypeDict.PREV_CONTEXT}['${LeftTarget}'] || ${value},`;
			}
			return `${LeftTarget}: ${TAssignTypeDict.PREV_CONTEXT}['${LeftTarget}'],`;
		}

		const { TargetProperty: RightTarget } = boundProperty.KeyItemDeclaration;
		const isEmptyInitial = !isKeyItemWithExpression(context);

		const isEmptyBoundExpression = !isKeyItemWithExpression(boundProperty);

		if (isEmptyBoundExpression && isEmptyInitial) {
			return `
				${LeftTarget} : ${type}['${RightTarget}'] || null,
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
			const rightValue = this.getByExpressionValue(boundProperty);

			return `${LeftTarget}: ${type}['${RightTarget}'] || ${rightValue} || ${leftValue},`;
		}
		return `${LeftTarget}: null,`;
	}

	private getByExpressionValue<T extends TMappedKeys>({
		KeyItemDeclaration: { Expression },
	}: TKeyItemWithExpression<T>) {
		return Expressions[Expression.expressionType](Expression);
	}
}
