import { ICodegen, TGetCodeOptionsMap, TModuleParams } from '../../../types/common';
import { eta } from '../../eta';
import { ModuleNames } from '../index';
import { JavaScriptCodegen } from '../JavaScript';
import { JavaScriptCompiler } from '../JavaScript/JavaScriptCompiler';

export class TypeScriptCodegen extends JavaScriptCodegen implements ICodegen<typeof ModuleNames.TypeScript> {
	constructor(params: TModuleParams) {
		super(params);
		this.imports['@yantrix/core']!.push('TAutomataBaseActionType', 'TAutomataBaseStateType');
		this.expressions = JavaScriptCompiler.expressions.functions.setupExpressions({
			constants: this.constants,
			hasTypes: true,
		});
	}

	protected override buildTemplateModel(className: string) {
		return { ...super.buildTemplateModel(className), hasTypes: true };
	}

	public override getCode(options: TGetCodeOptionsMap[typeof ModuleNames.TypeScript]) {
		const it = this.buildTemplateModel(options.className);
		const rendered = eta.render('ts/module.eta', it);
		if (rendered == null) throw new Error('Eta render returned null/undefined for ts/module');
		return rendered;
	}
}
