import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
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

		fillDictionaries(diagram, this.stateDictionary, this.actionDictionary);

		this.dictionaries = JavaScriptCompiler.dictionaries.functions.setupDictionaries({
			dependencyGraph: this.dependencyGraph,
			diagram: this.diagram,
			expressionRecord: this.expressions,
			actionDictionary: this.actionDictionary,
			stateDictionary: this.stateDictionary,
		});
	}

	public getCode(options: TGetCodeOptionsMap[typeof ModuleNames.JavaScript]) {
		return `
			${JavaScriptCompiler.imports.serializer.getImportsCode({ imports: this.imports })}
			${JavaScriptCompiler.dictionaries.serializer.getDictionariesCode({
					dictionaries: this.dictionaries,
				})}
			${JavaScriptCompiler.dictionaries.serializer.getActionsMap({
					actionDictionary: this.actionDictionary,
				})}
			${JavaScriptCompiler.dictionaries.serializer.getStatesMap({
					stateDictionary: this.stateDictionary,
				})}
			${JavaScriptCompiler.dictionaries.serializer.getSerializedSetByPassed({
					byPassedList: getStatesByPass(this.diagram, this.stateDictionary),
				})}
			${JavaScriptCompiler.context.contextSerializer.getDefaultContext({
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
				})}
		`;
	}
}
