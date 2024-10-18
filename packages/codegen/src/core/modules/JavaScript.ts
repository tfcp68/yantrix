import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import { ICodegen, TGetCodeOptionsMap, TModuleParams, TStateDiagramMatrixIncludeNotes } from '../../types/common.js';
import { fillDictionaries } from '../shared.js';
import { TConstants, TExpressionRecord } from './../../types/common';
import { ModuleNames } from './index';
import {
	buildDependencyGraph,
	getActionsMap,
	getActionToStateFromState,
	getClassTemplate,
	getDefaultContext,
	getDictionariesCode,
	getImportsCode,
	getStatesMap,
	setupDictionaries,
	setupExpressions,
	TImports,
} from './JavaScript/cleared';

export class JavaScriptCodegen implements ICodegen<typeof ModuleNames.JavaScript> {
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
	diagram: TStateDiagramMatrixIncludeNotes;
	handlersDict: string[];

	// initialContext: string;
	initialContextKeys: string[];
	changeStateHandlers: string[];
	dependencyGraph: Map<string, Set<string>>;
	constants: TConstants | null;
	expressions: TExpressionRecord;
	dictionaries: string[];
	protected imports: TImports = {
		'@yantrix/automata': ['GenericAutomata', 'FunctionDictionary'],
		'@yantrix/functions': ['builtInFunctions'],
	};

	constructor({ diagram, constants }: TModuleParams) {
		this.actionDictionary = new BasicActionDictionary();
		this.stateDictionary = new BasicStateDictionary();

		this.diagram = diagram;

		this.constants = constants;

		this.expressions = setupExpressions({
			constants: this.constants,
		});

		const buildDependencyGraphResult = buildDependencyGraph({
			dependencyGraph: new Map(),
			diagram: this.diagram,
			imports: this.imports,
		});
		this.imports = buildDependencyGraphResult.imports;
		this.dependencyGraph = buildDependencyGraphResult.dependencyGraph;

		this.handlersDict = [];
		this.changeStateHandlers = [];
		this.dictionaries = [];
		this.initialContextKeys = [];

		fillDictionaries(diagram, this.stateDictionary, this.actionDictionary);

		this.dictionaries = setupDictionaries({
			dependencyGraph: this.dependencyGraph,
			diagram: this.diagram,
			expressions: this.expressions,
			actionDictionary: this.actionDictionary,
			stateDictionary: this.stateDictionary,
		});
	}

	public getCode(options: TGetCodeOptionsMap[typeof ModuleNames.JavaScript]) {
		return `
			${getImportsCode({ imports: this.imports })}
			${getDictionariesCode({
					dictionaries: this.dictionaries,
				})}
			const actionsMap = ${JSON.stringify(getActionsMap({
		actionDictionary: this.actionDictionary,
	}), null, 2)}
			const statesMap = ${JSON.stringify(getStatesMap({
		stateDictionary: this.stateDictionary,
	}), null, 2)}
			${getDefaultContext({
					expressions: this.expressions,
					diagram: this.diagram,
					stateDictionary: this.stateDictionary,
				})}
			${getActionToStateFromState({
					diagram: this.diagram,
					stateDictionary: this.stateDictionary,
					actionDictionary: this.actionDictionary,
				})}
			${getClassTemplate({
					className: options.className,
					diagram: this.diagram,
					stateDictionary: this.stateDictionary,
				})}
		`;
	}
}
