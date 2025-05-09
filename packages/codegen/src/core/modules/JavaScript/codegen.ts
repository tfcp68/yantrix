import { BasicActionDictionary, BasicEventDictionary, BasicStateDictionary } from '@yantrix/automata';
import { TNullable } from '@yantrix/utils';
import { TDefine, TInjectIdent } from '@yantrix/yantrix-parser';
import { DEFAULT_USER_FUNCTIONS_NAMESPACE } from '../../../constants';
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

	defines: TDefine[];
	injects: TInjectIdent[];

	initialContextKeys: string[];
	changeStateHandlers: string[];
	dependencyGraph: Map<string, Set<string>>;
	constants: TConstants | null;
	expressions: TExpressionRecord;
	injectedPath: TNullable<string> = null;

	dictionaries: string[];
	protected importNamespaces: TNullable<TImports> = {};
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

	constructor({ diagram, constants, injectedFunctions }: TModuleParams) {
		this.stateDictionary = new BasicStateDictionary();
		this.actionDictionary = new BasicActionDictionary();
		this.eventDictionary = new BasicEventDictionary();

		this.diagram = diagram;

		this.constants = constants;

		this.defines = diagram.states.flatMap(state => state.notes?.defines ?? []);
		this.injects = diagram.states.flatMap(state => state.notes?.inject ?? []);

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

		if (injectedFunctions.path) {
			this.importNamespaces = {
				[injectedFunctions.path]: [DEFAULT_USER_FUNCTIONS_NAMESPACE],
			};
			this.injectedPath = injectedFunctions.path;
		}

		fillDictionaries(diagram, this.stateDictionary, this.actionDictionary, this.eventDictionary);

		this.dictionaries = JavaScriptCompiler.dictionaries.functions.setupDictionaries({
			dependencyGraph: this.dependencyGraph,
			diagram: this.diagram,
			expressionRecord: this.expressions,
			actionDictionary: this.actionDictionary,
			stateDictionary: this.stateDictionary,
			eventDictionary: this.eventDictionary,
			injectedFunctions,
			imports: this.imports,
		});
	}

	public async getCode(options: TGetCodeOptionsMap[typeof ModuleNames.JavaScript]) {
		const props = {
			imports: this.imports,
			importNamespaces: this.importNamespaces,
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
			defines: this.defines,
			injectedPath: this.injectedPath,
			injects: this.injects,
		};
		return `
			${JavaScriptCompiler.imports.serializer.getImportsCode(props)}
			${JavaScriptCompiler.imports.serializer.importAll(props)}
			${JavaScriptCompiler.functions.serializer(props)}
			${JavaScriptCompiler.dictionaries.serializer.getDictionariesCode(props)}
			${JavaScriptCompiler.events.serializer.getEventAdapterCode(props)}
			${JavaScriptCompiler.events.serializer.getCreateEventBusFunctionCode()}
			${JavaScriptCompiler.dictionaries.serializer.getActionsMap(props)}
			${JavaScriptCompiler.dictionaries.serializer.getStatesMap(props)}
			${JavaScriptCompiler.dictionaries.serializer.getSerializedSetByPassed(props)}
			${JavaScriptCompiler.context.serializer.getDefaultContext(props)}
			${JavaScriptCompiler.context.serializer.getStateReducerCode(props)}
			${await JavaScriptCompiler.forks.serializer.getPredicatesCode(props)}
			${JavaScriptCompiler.dictionaries.serializer.getActionToStateFromState(props)}
			${JavaScriptCompiler.class.serializer.getClassTemplate(props)}
		`;
	}
}
