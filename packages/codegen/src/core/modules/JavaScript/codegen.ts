import { BasicActionDictionary, BasicEventDictionary, BasicStateDictionary } from '@yantrix/automata';
import {
	ICodegen,
	TConstants,
	TExpressionRecord,
	TGetCodeOptionsMap,
	TModuleParams,
	TStateDiagramMatrixIncludeNotes,
} from '../../../types/common';
import { fillDictionaries } from '../../shared';
import { ModuleNames } from '../index';
import { JavaScriptCompiler } from './JavaScriptCompiler';
import { TImports } from './JavaScriptCompiler/imports';

export class JavaScriptCodegen implements ICodegen<typeof ModuleNames.JavaScript> {
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
	eventDictionary: BasicEventDictionary;
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
		'@yantrix/automata': [
			'GenericAutomata',
			'FunctionDictionary',
			'EventDictionary as GlobalEventDictionary',
			'AutomataEventAdapter',
			'EventBus',
		],
		'@yantrix/functions': ['builtInFunctions'],
	};

	constructor({ diagram, constants }: TModuleParams) {
		this.stateDictionary = new BasicStateDictionary();
		this.actionDictionary = new BasicActionDictionary();
		this.eventDictionary = new BasicEventDictionary();

		this.diagram = diagram;

		this.constants = constants;

		this.expressions = JavaScriptCompiler.expressions.functions.setupExpressions({
			constants: this.constants,
		});

		const buildDependencyGraphResult = JavaScriptCompiler.imports.functions.buildDependencyGraph({
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

		fillDictionaries(diagram, this.stateDictionary, this.actionDictionary, this.eventDictionary);

		this.dictionaries = JavaScriptCompiler.dictionaries.functions.setupDictionaries({
			dependencyGraph: this.dependencyGraph,
			diagram: this.diagram,
			expressionRecord: this.expressions,
			actionDictionary: this.actionDictionary,
			stateDictionary: this.stateDictionary,
			eventDictionary: this.eventDictionary,
		});
	}

	public getCode(options: TGetCodeOptionsMap[typeof ModuleNames.JavaScript]) {
		return `
			${JavaScriptCompiler.imports.serializer.getImportsCode({ imports: this.imports })}
			${JavaScriptCompiler.dictionaries.serializer.getDictionariesCode({
					dictionaries: this.dictionaries,
				})}
			${JavaScriptCompiler.events.serializer.getRegisterGlobalEventsCode({
					eventDictionary: this.eventDictionary,
				})}
			${JavaScriptCompiler.events.serializer.getEventAdapterCode({
					diagram: this.diagram,
					stateDictionary: this.stateDictionary,
					actionDictionary: this.actionDictionary,
					eventDictionary: this.eventDictionary,
					expressions: this.expressions,
				})}
			${JavaScriptCompiler.dictionaries.serializer.getActionsMap({
					actionDictionary: this.actionDictionary,
				})}
			${JavaScriptCompiler.dictionaries.serializer.getStatesMap({
					stateDictionary: this.stateDictionary,
				})}
			${JavaScriptCompiler.context.serializer.getDefaultContext({
					expressions: this.expressions,
					diagram: this.diagram,
					stateDictionary: this.stateDictionary,
				})}
			${JavaScriptCompiler.dictionaries.serializer.getActionToStateFromState({
					dictionariesSerializer: JavaScriptCompiler.dictionaries.serializer,
					diagram: this.diagram,
					stateDictionary: this.stateDictionary,
					actionDictionary: this.actionDictionary,
				})}
			${JavaScriptCompiler.class.serializer.getClassTemplate({
					classSerializer: JavaScriptCompiler.class.serializer,
					className: options.className,
					diagram: this.diagram,
					stateDictionary: this.stateDictionary,
					actionDictionary: this.actionDictionary,
					eventDictionary: this.eventDictionary,
					expressions: this.expressions,
				})}
		`;
	}
}
