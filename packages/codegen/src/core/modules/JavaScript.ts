import { ICodegen, TAssignTypeDict, TAssignTypes, TStateDiagramMatrixIncludeNotes } from '../../types/common.js';
import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import { StartState, TDiagramAction } from '@yantrix/mermaid-parser';
import { Expressions, fillDictionaries } from '../shared.js';
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

	constructor(diagram: TStateDiagramMatrixIncludeNotes) {
		this.actionDictionary = new BasicActionDictionary();
		this.stateDictionary = new BasicStateDictionary();
		this.diagram = diagram;

		this.handlersDict = [];
		this.changeStateHandlers = [];
		this.dictionaries = [];

		fillDictionaries(diagram, this.stateDictionary, this.actionDictionary);

		this.setupHandlers();
		this.setupDictionaries();
	}

	public getImports() {
		return `import { GenericAutomata } from "@yantrix/automata";`;
	}

	public getHandlers(): string {
		return this.handlersDict.join('\n');
	}

	public getDictionaries(): string {
		return this.dictionaries.join('\n');
	}

	public getChangeStateHandlers(): string {
		return this.changeStateHandlers.join('\n');
	}

	setupHandlers() {
		this.handlersDict.push('const handlersDict = {');

		Object.keys(this.diagram.transitions).map((state) => {
			this.handlersDict.push(this.getHandlerDict(state));
			this.changeStateHandlers.push(this.getHandleStateChanges(this.diagram.transitions[state], state));
		});
		this.handlersDict.push(' }');
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
                rootReducer: ({ action, context, payload, state }) => {
                  if (!action || payload === null) return { state, context };
                  return handlersDict[state]({action,payload,context,state})
  				},
  				stateValidator: (s) => Object.values(statesDictionary).includes(s),
  				actionValidator: (a) => Object.values(actionsDictionary).includes(a),
  				eventValidator: () => {},
  			});
  		}
  	}`;
	}

	getActionToStateDict(transitions: Record<string, TDiagramAction>) {
		return Object.keys(transitions).map((key) => {
			const { actionsPath } = transitions[key];
			const newState = this.stateDictionary.getStateValues({ keys: [key] });
			return actionsPath.map(({ action }) => {
				const actionValue = this.actionDictionary.getActionValues({
					keys: action,
				});

				const ctx = this.getSubsyntaxContext(key);

				return `${actionValue[0]}:{state:${newState[0]}, ctx:{${ctx}}},`;
			});
		});
	}

	getHandlerDict(state: string) {
		const stateValue = this.stateDictionary.getStateValues({
			keys: [state],
		})[0];
		return `${stateValue}: handleStateChange${stateValue}, \n`;
	}

	protected getHandleStateChanges(transitions: Record<string, TDiagramAction>, state: string) {
		const value = this.stateDictionary.getStateValues({ keys: [state] })[0];

		if (!value) {
			throw new Error(`State ${state} not found`);
		}
		return this.getHandleStateChangeDeclaration(
			value,
			`
             const actionToStateDict = {
              ${this.getActionToStateDict(transitions)
					.flatMap((el) => el)
					.join('\n')}     
         };
        
        const reducedState = actionToStateDict[action]?.state ?? null
        const newState = reducedState || state
        const ctx = reducedState ? actionToStateDict[action]?.ctx : {...prevContext}
        
 
		
        return {state:newState, context: ctx === null ? ctx : {...ctx}}
        `,
		);
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

		if (!startState?.notes?.initialState) {
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
