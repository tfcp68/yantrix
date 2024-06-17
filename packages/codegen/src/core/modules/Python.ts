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

	setupDictionaries() {
		this.dictionaries.push(
			`statesDictionary = ${JSON.stringify(this.stateDictionary.getDictionary(), null, 2)}`,
		);
		this.dictionaries.push(
			`actionsDictionary = ${JSON.stringify(this.actionDictionary.getDictionary(), null, 2)}`,
		);
	}

	getClassTemplate(className: string) {
		const content = [`class ${className}(GenericAutomata):`,
			`\tdef __init__(self):`,
			`\t\tself.state = ${this.initialState}`,
			`\t\tself.context = { 'index': -1 }`,
			`\t${this.getIsKeyOf()}`,
			`\t${this.getRootReducer()}`,
			`\t${this.getStateValidator()}`,
			`\t${this.getActionValidator()}`
		];
		return content.join('\n');
	}

	protected getIsKeyOf() {
		const content = [`def isKeyOf(self, key, obj):`,
			`\t\treturn key in obj`
		];
		return content.join('\n');
	}

	protected getRootReducer() {
		const content = [`def rootReducer(self, action, context, payload, state):`,
			`\t\tif (not action) or (payload is None):`,
			`\t\t\treturn {'state': state, 'context': context}`,
			`\t\t${this.getRootReducerStateValidation()}`,
			`\t\t${this.getRootReducerActionValidation()}`,
			`\t\tnewState = state`,
			`\t\tif actionToStateDict[state][action] is not None:`,
			`\t\t\tnewState = actionToStateDict[action]`,
			`\t\treturn {'state':  newState, 'context': dict({**payload})}`
		];
		return content.join('\n');
	}

	protected getRootReducerStateValidation() {
		const content = [`${this.getRootReducerStateValidationHead()}`,
			`\t\t\t${this.getRootReducerStateValidationError()}`
		];
		return content.join('\n');
	}

	protected getRootReducerStateValidationHead() {
		return `if not self.isKeyOf(state, actionToStateFromStateDict):`;
	}

	protected getRootReducerStateValidationError() {
		return `raise Exception("Invalid state, maybe machine isn't running.")`;
	}

	protected getRootReducerActionValidation() {
		const content = [`if not self.isKeyOf(action, actionToStateFromStateDict[state]):`,
			`\t\t\treturn {'state': state, 'context': context }`
		];
		return content.join('\n');
	}

	protected getStateValidator() {
		const content = [`def state_validator(self, s):`,
			`\t\treturn s in statesDictionary.values()`
		];
		return content.join('\n');
	}

	protected getActionValidator() {
		const content = [`def action_validator(self, a):`,
			`\t\treturn a in actionsDictionary.values()`
		];
		return content.join('\n');
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
