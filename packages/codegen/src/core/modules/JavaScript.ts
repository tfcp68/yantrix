import type { ICodegen } from '../../types/common.js';
import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import type { TDiagramAction, TStateDiagram } from '@yantrix/mermaid-parser';
import { fillDictionaries } from '../shared.js';

export class JavaScriptCodegen implements ICodegen {
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
	diagram: TStateDiagram;
	handlersDict: string[];
	changeStateHandlers: string[];
	initialState: null | number;
	dictionaries: string[];

	constructor(diagram: TStateDiagram) {
		this.actionDictionary = new BasicActionDictionary();
		this.stateDictionary = new BasicStateDictionary();

		this.diagram = diagram;
		this.handlersDict = [];
		this.changeStateHandlers = [];
		this.dictionaries = [];

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

	protected getHandleStateChanges(transitions: Record<string, TDiagramAction>, state: string) {
		const value = this.stateDictionary.getStateValues({ keys: [state] })[0];
		if (!value) {
			throw new Error(`State ${state} not found`);
		}
		return this.getHandleStateChangeDeclaration(value, this.getHandleStateChangesBody(value));
	}

	protected getHandleStateChangesBody(id: number) {
		return `
			const newState = actionToStateDict[${id}][action] ?? state;
			const isNewState = newState !== state;
			return { state: isNewState ? newState : state, context: isNewState ? { ...payload } : { ...prevContext } };
		`;
	}

	protected getHandleStateChangesBodyNewState() {
		return `const newState = actionToStateDict[action] ?? state;`;
	}

	protected getHandleStateChangeDeclaration(id: number, body: string) {
		return `const handleStateChange${id} = ({payload,action,context:prevContext,state}) => {${body}}`;
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
                rootReducer: ${this.getRootReducer()},
  				stateValidator: ${this.getStateValidator()},
  				actionValidator: ${this.getActionValidator()},
				});
			}
		}`;
	}

	protected getRootReducer() {
		return `({ action, context, payload, state }) => {
					if (!action || payload === null) return { state, context };
					${this.getRootReducerStateGuard()}
					return ${this.getRootReducerHandlersDict()};
  				}`;
	}

	protected getRootReducerStateGuard() {
		return `if (!state) throw new Error("Invalid state");`;
	}

	protected getRootReducerHandlersDict() {
		return `handlersDict[state]({action,payload,context,state})`;
	}

	protected getStateValidator() {
		return `(s) => Object.values(statesDictionary).includes(s)`;
	}

	protected getActionValidator() {
		return `(a) => Object.values(actionsDictionary).includes(a)`;
	}

	/**
	 * Возвращает объект возможных переходов к состояням из каждого состояния
	 * Пример вида { состояние1: { действие1: состояние2 } }
	 */
	protected getActionToStateFromStateDict() {
		let actionToStateFromStateDict: Record<number, Record<number, number>> = {};
		Object.keys(this.diagram.transitions).map((state) => {
			const transitions = this.diagram.transitions[state];
			const value = this.stateDictionary.getStateValues({ keys: [state] })[0];
			if (!value) throw new Error(`State ${state} not found`);
			actionToStateFromStateDict[value] = this.getActionToStateDict(transitions);
		});
		return actionToStateFromStateDict;
	}

	public getActionToStateFromState() {
		return `const actionToStateDict = ${JSON.stringify(this.getActionToStateFromStateDict(), null, 2)}`;
	}

	/**
	 * Возвращает объект возможных переходов к состояниям из каждого действия
	 * Пример вида { действие1: состояние1 }
	 */
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

	getHandlerDict(state: string) {
		const stateValue = this.stateDictionary.getStateValues({
			keys: [state],
		})[0];
		return `${stateValue}: handleStateChange${stateValue}, \n`;
	}
}
