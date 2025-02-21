import { BasicActionDictionary, BasicEventDictionary, BasicStateDictionary } from '@yantrix/automata';
import {
	ICodegen,
	TConstants,
	TExpressionRecord,
	TGetCodeOptionsMap,
	TModuleParams,
	TStateDiagramMatrixIncludeNotes,
} from '../../../types/common';
import { fillDictionaries, getStatesByPass } from '../../shared';
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
		'@yantrix/core': [
			'GenericAutomata',
			'FunctionDictionary',
			'EventDictionary as GlobalEventDictionary',
			'AutomataEventAdapter',
			'BasicEventBus',
			'builtInFunctions',
		],
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
		const props = {
			imports: this.imports,
			dictionaries: this.dictionaries,
			diagram: this.diagram,
			stateDictionary: this.stateDictionary,
			actionDictionary: this.actionDictionary,
			eventDictionary: this.eventDictionary,
			expressions: this.expressions,
			byPassedList: getStatesByPass(this.diagram, this.stateDictionary),
			dictionariesSerializer: JavaScriptCompiler.dictionaries.serializer,
			classSerializer: JavaScriptCompiler.class.serializer,
			className: options.className,
		};
		return `
			${JavaScriptCompiler.imports.serializer.getImportsCode(props)}
			${JavaScriptCompiler.dictionaries.serializer.getDictionariesCode(props)}
			${JavaScriptCompiler.events.serializer.getEventAdapterCode(props)}
			${JavaScriptCompiler.events.serializer.getCreateEventBusFunctionCode()}
			${JavaScriptCompiler.dictionaries.serializer.getActionsMap(props)}
			${JavaScriptCompiler.dictionaries.serializer.getStatesMap(props)}
			${JavaScriptCompiler.dictionaries.serializer.getSerializedSetByPassed(props)}
			${JavaScriptCompiler.context.serializer.getDefaultContext(props)}
			${JavaScriptCompiler.context.serializer.getStateReducerCode(props)}
			${JavaScriptCompiler.forks.serializer.getPredicatesCode(props)}
			${JavaScriptCompiler.dictionaries.serializer.getActionToStateFromState(props)}
			${JavaScriptCompiler.class.serializer.getClassTemplate(props)}
		`;
	}
}
