import type { ICodegen } from '../../types/common.js';
import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import type { TDiagramAction, TStateDiagram } from '@yantrix/mermaid-parser';
import { fillDictionaries } from '../shared.js';
import { convertKeysToNumberString } from '../../utils/utils.js';

export class PythonCodegen implements ICodegen {
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
	diagram: TStateDiagram;
	initialState: null | number;
	dictionaries: string[];
	protected imports = {
		'@yantrix/automata': ['GenericAutomata'],
	};

	constructor(diagram: TStateDiagram) {
		this.actionDictionary = new BasicActionDictionary();
		this.stateDictionary = new BasicStateDictionary();

		this.diagram = diagram;
		this.dictionaries = [];

		fillDictionaries(diagram, this.stateDictionary, this.actionDictionary);
		this.initialState = Object.values(this.stateDictionary.getDictionary())[0];
		this.setupDictionaries();
	}

	public getImports() {
		let imports = '';
		for (const [key, value] of Object.entries(this.imports)) {
			imports += `from '${key}' import ${value.join(', ')}\n`;
		}
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
	}

	getClassTemplate(className: string) {
		return `class ${className}(GenericAutomata):
                    def __init__(self):
                        self.state = ${this.initialState}
                        self.context = { 'index': -1 }
                    ${this.getIsKeyOf()}

                    ${this.getRootReducer()}
  				    ${this.getStateValidator()}
  				    ${this.getActionValidator()}
                `;
	}

	protected getIsKeyOf() {
		return `def isKeyOf(self, key, obj):
    				return key in obj
				`;
	}

	protected getRootReducer() {
		return `def rootReducer(self, action, context, payload, state):
					if (not action) or (payload is None):
                        return {'state': state, 'context': context}
					${this.getRootReducerStateValidation()}
					${this.getRootReducerActionValidation()}
					newState = state
					if actionToStateDict[state][action] is not None:
						newState = actionToStateDict[action]
					return {'state':  newState, 'context': { **payload }}
  				}`;
	}

	protected getRootReducerStateValidation() {
		return `${this.getRootReducerStateValidationHead()} ${this.getRootReducerStateValidationError()}`;
	}

	protected getRootReducerStateValidationHead() {
		return `if not self.isKeyOf(state, actionToStateFromStateDict):
					`;
	}

	protected getRootReducerStateValidationError() {
		return `raise Error("Invalid state, maybe machine isn't running.")`;
	}

	protected getRootReducerActionValidation() {
		return `if not self.isKeyOf(action, actionToStateFromStateDict[state]):
					return { 'state': state, 'context': context }
				`;
	}

	protected getStateValidator() {
		return `def state_validator(self, s):
                    return s in statesDictionary.values()
                `;
	}

	protected getActionValidator() {
		return `def action_validator(self, a):
                    return a in actionsDictionary.values()
                `;
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

	public getActionToStateFromState() {
		return `actionToStateFromStateDict = ${convertKeysToNumberString(this.getActionToStateFromStateDict())}`;
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
}
