import { ICodegen, TGetCodeOptionsMap, TModuleParams } from '../../../types/common';
import { eta } from '../../eta';
import { ModuleNames } from '../index';
import { JavaScriptCodegen } from '../JavaScript';

export class TypeScriptCodegen extends JavaScriptCodegen implements ICodegen<typeof ModuleNames.TypeScript> {
	constructor(params: TModuleParams) {
		super(params);
		this.imports['@yantrix/core']!.push('TAutomataBaseActionType', 'TAutomataBaseStateType', 'TValidator');
	}

	public override getCode(options: TGetCodeOptionsMap[typeof ModuleNames.TypeScript]) {
		const it = this.buildTemplateModel(options.className);
		const rendered = eta.render('ts/module.eta', it);
		if (rendered == null) throw new Error('Eta render returned null/undefined for ts/module');
		return rendered;
	}
}
