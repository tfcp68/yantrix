import { ICodegen, TExpressionRecord, TStateDiagramMatrixIncludeNotes } from '../../types/common.js';
import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import type { TDiagramAction } from '@yantrix/mermaid-parser';
import { fillDictionaries } from '../shared.js';
import {
	ExpressionTypes,
	isKeyItemWithExpression,
	isPayloadContext,
	TKeyItem,
	TKeyItemWithExpression,
} from '@yantrix/yantrix-parser';

export class JavaScriptCodegen implements ICodegen {
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
	diagram: TStateDiagramMatrixIncludeNotes;
	handlersDict: string[];
	changeStateHandlers: string[];
	initialState: null | number;
	dictionaries: string[];
	expressionsDict: TExpressionRecord;

	constructor(diagram: TStateDiagramMatrixIncludeNotes) {
		this.actionDictionary = new BasicActionDictionary();
		this.stateDictionary = new BasicStateDictionary();
		this.diagram = diagram;

		this.handlersDict = [];
		this.changeStateHandlers = [];
		this.dictionaries = [];

		this.expressionsDict = this.fillExpression();

		fillDictionaries(diagram, this.stateDictionary, this.actionDictionary);

		this.initialState = Object.values(this.stateDictionary.getDictionary())[0];
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
  				state: ${this.initialState},
  				context: { index: -1 },
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

				return `${actionValue[0]}:{state:${newState[0]}, ${this.getSubsyntaxContext(key || null)}},`;
			});
		});
	}

	getHandlerDict(state: string) {
		const stateValue = this.stateDictionary.getStateValues({
			keys: [state],
		})[0];
		return `${stateValue}: handleStateChange${stateValue}, \n`;
	}

	protected fillExpression(): TExpressionRecord {
		return {
			[ExpressionTypes.StringDeclaration]: ({ StringDeclaration }) => `${StringDeclaration}`,
			[ExpressionTypes.NumberDeclaration]: ({ NumberDeclaration }) => `${NumberDeclaration}`,
			[ExpressionTypes.ArrayDeclaration]: (value) => '[]',
			[ExpressionTypes.Function]: (value) => {
				throw new Error(`Not implemented ${ExpressionTypes.Function}`);
			},
			[ExpressionTypes.Property]: () => {
				throw new Error(`Not implemented ${ExpressionTypes.Property}`);
			},
			[ExpressionTypes.FunctionProperty]: () => {
				throw new Error(`Not implemented ${ExpressionTypes.FunctionProperty}`);
			},
		};
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
        

		
        return {state:newState, context:{...ctx}}
        `,
		);
	}

	protected getHandleStateChangeDeclaration(value: number, body: string) {
		return `const handleStateChange${value} = ({payload,action,context:prevContext,state}) => {${body}}`;
	}

	protected getSubsyntaxContext(state: string | null) {
		const value = this.diagram.states.find((diagramState) => diagramState.id === state);

		if (!value) {
			throw new Error(`Invalid state - ${value}`);
		}
		if (!value.notes) {
			return `ctx: null`;
		}
		const { contextDescription } = value.notes;

		const res = contextDescription
			.map((ctx) => {
				return ctx.context.map((el, index) => {
					if (isPayloadContext(ctx)) {
						const { context, payload } = ctx;
						return context.map((ctxItem, index) => {
							const boundProperty = payload[index] || null;
							return this.getContextValues(ctxItem, boundProperty, 'payload');
						});
					} else {
						const { context, prevContext } = ctx;
						return context.map((ctxItem, index) => {
							const boundProperty = prevContext[index] || null;
							return this.getContextValues(ctxItem, boundProperty, 'prevContext');
						});
					}
				});
			})
			.flatMap((template) => template.flatMap((el) => el));

		return `
			ctx: {${res.join('\r\n')}}
		`;
	}

	private getContextValues(context: TKeyItem, boundProperty: TKeyItem, type: 'payload' | 'prevContext') {
		const { TargetProperty: LeftTarget } = context.KeyItemDeclaration;
		const { TargetProperty: RightTarget } = boundProperty.KeyItemDeclaration;

		const isEmptyBoundExpression = !isKeyItemWithExpression(boundProperty);
		const isEmptyInitial = !isKeyItemWithExpression(context);

		if (isEmptyBoundExpression && isEmptyInitial) {
			return `
				${LeftTarget} : ${type}['${RightTarget}'],;
			`;
		}
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
		// @ts-ignore - Мужики я честно пытался это пофиксить, но у меня не вышло(
		return this.expressionsDict[expressionType](value);
	}
}
