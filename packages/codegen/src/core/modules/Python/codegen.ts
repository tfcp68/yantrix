import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import {
	ICodegen,
	TConstants,
	// TExpressionRecord,
	TGetCodeOptionsMap,
	TModuleParams,
	TStateDiagramMatrixIncludeNotes,
} from '../../../types/common';
// import { convertKeysToNumberString } from '../../../utils/utils';
import { fillDictionaries } from '../../shared'; // getStatesByPass
import { ModuleNames } from '../index';
import { PythonCompiler } from './PythonCompiler';
import { TImports } from './PythonCompiler/imports';

export class PythonCodegen implements ICodegen<typeof ModuleNames.Python> {
	stateDictionary: BasicStateDictionary;
	actionDictionary: BasicActionDictionary;
	diagram: TStateDiagramMatrixIncludeNotes;
	handlersDict: string[];

	// initialContext: string;
	initialContextKeys: string[];
	changeStateHandlers: string[];
	dependencyGraph: Map<string, Set<string>>;
	constants: TConstants | null;
	// expressions: TExpressionRecord;
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

		// this.expressions = PythonCompiler.expressions.functions.setupExpressions({
		// 	constants: this.constants,
		// });

		const buildDependencyGraphResult = PythonCompiler.imports.functions.buildDependencyGraph({
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

		// this.dictionaries = PythonCompiler.dictionaries.functions.setupDictionaries({
		// 	dependencyGraph: this.dependencyGraph,
		// 	diagram: this.diagram,
		// 	expressionRecord: this.expressions,
		// 	actionDictionary: this.actionDictionary,
		// 	stateDictionary: this.stateDictionary,
		// });
	}

	public getCode(options: TGetCodeOptionsMap[typeof ModuleNames.Python]) {
		const content = [
			`${PythonCompiler.imports.serializer.getImportsCode({ imports: this.imports })}`,
			`${PythonCompiler.class.serializer.getClassTemplate({
				classSerializer: PythonCompiler.class.serializer,
				className: options.className,
				diagram: this.diagram,
				stateDictionary: this.stateDictionary,
			})}`,
		];
		return content.join('\n');
	}
}

/**
${PythonCompiler.dictionaries.serializer.getDictionariesCode({
		dictionaries: this.dictionaries,
	})}
${PythonCompiler.dictionaries.serializer.getActionsMap({
		actionDictionary: this.actionDictionary,
	})}
${PythonCompiler.dictionaries.serializer.getStatesMap({
		stateDictionary: this.stateDictionary,
	})}
${PythonCompiler.dictionaries.serializer.getSerializedSetByPassed({
		byPassedList: getStatesByPass(this.diagram, this.stateDictionary),
	})}
${PythonCompiler.context.contextSerializer.getDefaultContext({
		expressions: this.expressions,
		diagram: this.diagram,
		stateDictionary: this.stateDictionary,
	})}
${PythonCompiler.dictionaries.serializer.getActionToStateFromState({
		dictionariesSerializer: PythonCompiler.dictionaries.serializer,
		diagram: this.diagram,
		stateDictionary: this.stateDictionary,
		actionDictionary: this.actionDictionary,
	})}
 */
