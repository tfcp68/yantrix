import { ICodegen, TGetCodeOptionsMap, TModuleParams } from '../../../types/common';
import { getStatesByPass } from '../../shared';
import { ModuleNames } from '../index';
import { JavaScriptCodegen } from '../JavaScript';
import { TypeScriptCompiler } from './TypescriptCompiler';

export class TypeScriptCodegen extends JavaScriptCodegen implements ICodegen<typeof ModuleNames.TypeScript> {
	constructor(params: TModuleParams) {
		super(params);
		this.imports['@yantrix/core']!.push('TAutomataBaseActionType', 'TAutomataBaseStateType', 'TValidator');
	}

	public override getCode(options: TGetCodeOptionsMap[typeof ModuleNames.TypeScript]) {
		const props = {
			imports: this.imports,
			dictionaries: this.dictionaries,
			diagram: this.diagram,
			stateDictionary: this.stateDictionary,
			actionDictionary: this.actionDictionary,
			eventDictionary: this.eventDictionary,
			expressions: this.expressions,
			byPassedList: getStatesByPass(this.diagram, this.stateDictionary),
			dictionariesSerializer: TypeScriptCompiler.dictionaries.serializer,
			classSerializer: TypeScriptCompiler.class.serializer,
			className: options.className,
		};
		return `
			${TypeScriptCompiler.imports.serializer.getImportsCode(props)}
			${TypeScriptCompiler.dictionaries.serializer.getDictionariesCode(props)}
			${TypeScriptCompiler.events.serializer.getEventAdapterCode(props)}
			${TypeScriptCompiler.events.serializer.getCreateEventBusFunctionCode()}
			${TypeScriptCompiler.dictionaries.serializer.getActionsMap(props)}
			${TypeScriptCompiler.dictionaries.serializer.getStatesMap(props)}
			${TypeScriptCompiler.dictionaries.serializer.getSerializedSetByPassed(props)}
			export type TActions${options.className} = keyof typeof actionsMap;
			${TypeScriptCompiler.context.serializer.getDefaultContext(props)}
			${TypeScriptCompiler.context.serializer.getStateReducerCode(props)}
			${TypeScriptCompiler.forks.serializer.getPredicatesCode(props)}
			${TypeScriptCompiler.dictionaries.serializer.getActionToStateFromState(props)}
			${TypeScriptCompiler.class.serializer.getClassTemplate(props)}
			${TypeScriptCompiler.dictionaries.serializer.getAutomataEpochCounterCode()}
			${TypeScriptCompiler.dictionaries.serializer.getAutomataInternalsRegisterCode(props)}
			${TypeScriptCompiler.dictionaries.serializer.getFunctionDictionaryInternalRegisterCode()}
			${TypeScriptCompiler.dictionaries.serializer.getFunctionDictionaryBuiltInRegisterCode()}
		`;

		/*
			правильный порядок

			return `
				${TypeScriptCompiler.imports.serializer.getImportsCode(props)}
				${TypeScriptCompiler.dictionaries.serializer.getDictionariesCode(props)}
				${TypeScriptCompiler.events.serializer.getEventAdapterCode(props)}
				${TypeScriptCompiler.events.serializer.getCreateEventBusFunctionCode()}
				${TypeScriptCompiler.dictionaries.serializer.getActionsMap(props)}
				${TypeScriptCompiler.dictionaries.serializer.getStatesMap(props)}
				${TypeScriptCompiler.dictionaries.serializer.getSerializedSetByPassed(props)}
				export type TActions${options.className} = keyof typeof actionsMap;
				${TypeScriptCompiler.dictionaries.serializer.getStatesMap(props)}
				${TypeScriptCompiler.context.serializer.getDefaultContext(props)}
				${TypeScriptCompiler.context.serializer.getStateReducerCode(props)}
				${TypeScriptCompiler.forks.serializer.getPredicatesCode(props)}
				${TypeScriptCompiler.dictionaries.serializer.getActionToStateFromState(props)}
				${TypeScriptCompiler.class.serializer.getClassTemplate(props)}
			`;
		*/
	}
}
