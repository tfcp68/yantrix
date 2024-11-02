import { ICodegen, TGetCodeOptionsMap, TModuleParams } from '../../../types/common';
import { getStatesByPass } from '../../shared';
import { ModuleNames } from '../index';
import { JavaScriptCodegen } from '../JavaScript';
import { TypeScriptCompiler } from './TypescriptCompiler';

export class TypeScriptCodegen extends JavaScriptCodegen implements ICodegen<typeof ModuleNames.TypeScript> {
	constructor(params: TModuleParams) {
		super(params);
		this.imports['@yantrix/automata']!.push('TAutomataBaseActionType', 'TAutomataBaseStateType', 'TValidator');
	}

	public override getCode(options: TGetCodeOptionsMap[typeof ModuleNames.TypeScript]) {
		return `
			${TypeScriptCompiler.imports.serializer.getImportsCode({ imports: this.imports })}
			${TypeScriptCompiler.dictionaries.serializer.getDictionariesCode({
					dictionaries: this.dictionaries,
				})}
			${TypeScriptCompiler.dictionaries.serializer.getActionsMap({
					actionDictionary: this.actionDictionary,
				})}
			${TypeScriptCompiler.dictionaries.serializer.getSerializedSetByPassed({
					byPassedList: getStatesByPass(this.diagram, this.stateDictionary),
				})}
			export type TActions${options.className} = keyof typeof actionsMap;
			${TypeScriptCompiler.dictionaries.serializer.getStatesMap({
					stateDictionary: this.stateDictionary,
				})}
			${TypeScriptCompiler.context.contextSerializer.getDefaultContext({
					expressions: this.expressions,
					diagram: this.diagram,
					stateDictionary: this.stateDictionary,
				})}
			${TypeScriptCompiler.dictionaries.serializer.getActionToStateFromState({
					dictionariesSerializer: TypeScriptCompiler.dictionaries.serializer,
					diagram: this.diagram,
					stateDictionary: this.stateDictionary,
					actionDictionary: this.actionDictionary,
				})}
			${TypeScriptCompiler.class.serializer.getClassTemplate({
					classSerializer: TypeScriptCompiler.class.serializer,
					className: options.className,
					diagram: this.diagram,
					stateDictionary: this.stateDictionary,
				})}
		`;
	}
}
