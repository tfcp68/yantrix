// packages/codegen/src/core/modules/JavaScript/codegen.ts
import { BasicActionDictionary, BasicEventDictionary, BasicStateDictionary } from '@yantrix/automata';
import { StartState } from '@yantrix/mermaid-parser';
import { TNullable } from '@yantrix/utils';
import {
	DefineStatement,
	getDefineStatements,
	getInjectStatements,
	InjectStatement,
} from '@yantrix/yantrix-parser';
import { ByPassAction, DEFAULT_USER_FUNCTIONS_NAMESPACE } from '../../../constants';
import {
	ICodegen,
	TConstants,
	TExpressionRecord,
	TGetCodeOptionsMap,
	TModuleParams,
	TStateDiagramMatrixIncludeNotes,
	TUserFunctionsDict,
} from '../../../types/common';
import { eta } from '../../eta';
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

	defines: DefineStatement[];
	injects: InjectStatement[];

	initialContextKeys: string[];
	changeStateHandlers: string[];
	dictionaries: string[];
	dependencyGraph: Map<string, Set<string>>;
	constants: TConstants | null;
	expressions: TExpressionRecord;
	injectedPath: TNullable<string> = null;
	injectedFunctions: TUserFunctionsDict;

	protected importNamespaces: TNullable<TImports> = {};
	protected imports: TImports = {
		'@yantrix/core': [
			'GenericAutomata',
			'FunctionDictionary',
			'EventDictionary as GlobalEventDictionary',
			'AutomataEventAdapter',
			'BasicEventBus',
			'builtInFunctions',
			'internalFunctions',
		],
	};

	constructor({ diagram, constants, injectedFunctions }: TModuleParams) {
		this.stateDictionary = new BasicStateDictionary();
		this.actionDictionary = new BasicActionDictionary();
		this.eventDictionary = new BasicEventDictionary();

		this.diagram = diagram;

		this.constants = constants;
		this.injectedFunctions = injectedFunctions;

		this.defines = diagram.states.flatMap(state => state.notes ? getDefineStatements(state.notes) : []);
		this.injects = diagram.states.flatMap(state => state.notes ? getInjectStatements(state.notes) : []);

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
			actionDictionary: this.actionDictionary,
			stateDictionary: this.stateDictionary,
			eventDictionary: this.eventDictionary,
		});
	}

	public getCode(options: TGetCodeOptionsMap[typeof ModuleNames.JavaScript]) {
		const initialStateId = JavaScriptCompiler.state.functions.getInitialState({ diagram: this.diagram });
		const initialStateValue = this.stateDictionary.getStateValues({ keys: [initialStateId] })[0];
		if (initialStateValue == null) throw new Error('Invalid initial state');

		const startCtx = JavaScriptCompiler.context.functions
			.getInitialContextShape({ diagram: this.diagram, stateName: StartState });
		const initialCtxForInitialState = JavaScriptCompiler.context.functions
			.getInitialContextShape({ diagram: this.diagram, stateName: initialStateId });
		const initialContext = Object.assign({}, startCtx, initialCtxForInitialState);

		const predicatesModel = JavaScriptCompiler.forks.serializer.getPredicatesCode({
			diagram: this.diagram,
			stateDictionary: this.stateDictionary,
			actionDictionary: this.actionDictionary,
			expressions: this.expressions,
		});

		// events: eventAdapter, handlers, createEventBus
		const eventAdapterCode = JavaScriptCompiler.events.serializer.getEventAdapterCode({
			diagram: this.diagram,
			stateDictionary: this.stateDictionary,
			actionDictionary: this.actionDictionary,
			eventDictionary: this.eventDictionary,
			expressions: this.expressions,
		});
		const createEventBusCode = JavaScriptCompiler.events.serializer.getCreateEventBusFunctionCode();

		// dictionaries, transition matrix, byPassed, epoch/internals/registry
		const actionToStateFromStateDictCode = JavaScriptCompiler.dictionaries.serializer.getActionToStateFromState({
			diagram: this.diagram,
			stateDictionary: this.stateDictionary,
			actionDictionary: this.actionDictionary,
			dictionariesSerializer: JavaScriptCompiler.dictionaries.serializer,
		});
		const byPassedStatesCode = JavaScriptCompiler.dictionaries.serializer.getSerializedSetByPassed({
			byPassedList: getStatesByPass(this.diagram, this.stateDictionary),
		});
		const actionsMapCode = JavaScriptCompiler.dictionaries.serializer.getActionsMap({
			actionDictionary: this.actionDictionary,
		});
		const statesMapCode = JavaScriptCompiler.dictionaries.serializer.getStatesMap({
			stateDictionary: this.stateDictionary,
		});
		const epochCode = JavaScriptCompiler.dictionaries.serializer.getAutomataEpochCounterCode();
		const internalsRegistryCode = JavaScriptCompiler.dictionaries.serializer.getAutomataInternalsRegisterCode({
			className: options.className,
		});
		const functionRegistryInternalRegisterCode = JavaScriptCompiler.dictionaries.serializer
			.getFunctionDictionaryInternalRegisterCode();
		const functionRegistryBuiltInRegisterCode = JavaScriptCompiler.dictionaries.serializer
			.getFunctionDictionaryBuiltInRegisterCode();

		const userFunctionsCheck = JavaScriptCompiler.functions.functions.getUserFunctionsCheckModel({
			injectedPath: this.injectedPath,
			injects: this.injects,
		});
		const customRegistrations = JavaScriptCompiler.functions.functions.getCustomFunctionRegistrationsModel({
			diagram: this.diagram,
			dependencyGraph: this.dependencyGraph,
			expressions: this.expressions,
			injectFunctions: this.injectedFunctions,
		});
		const userFunctionsNamespace = this.injectedPath && this.importNamespaces?.[this.injectedPath]?.[0]
			? this.importNamespaces[this.injectedPath]![0] ?? {}
			: null;

		const it = {
			className: options.className,

			imports: this.imports,
			importNamespaces: this.importNamespaces,
			diagram: this.diagram,
			stateDictionary: this.stateDictionary,
			actionDictionary: this.actionDictionary,
			eventDictionary: this.eventDictionary,
			expressions: this.expressions,
			defines: this.defines,
			injects: this.injects,
			injectedPath: this.injectedPath,
			functionsVM: {
				userFunctionsCheck,
				customRegistrations,
				userFunctionsNamespace,
			},
			initialStateId,
			initialStateValue,
			initialContext,
			startStateKey: StartState,

			// bypass action name
			byPassAction: ByPassAction,
			contextSerializer: JavaScriptCompiler.context.serializer,

			// forks/events/dictionaries
			forks: {
				predicatesModel,
			},
			events: {
				eventAdapterCode,
				createEventBusCode,
			},
			dictionariesVM: {
				actionToStateFromStateDictCode,
				byPassedStatesCode,
				actionsMapCode,
				statesMapCode,
				epochCode,
				internalsRegistryCode,
				functionRegistryInternalRegisterCode,
				functionRegistryBuiltInRegisterCode,
			},
		};

		const rendered = eta.render('js/module.eta', it);
		if (rendered == null) throw new Error('Eta render returned null/undefined for js/module');
		return rendered;
	}
}
