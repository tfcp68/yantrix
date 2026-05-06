import { ICodegen, TCodegenFiles, TGetCodeOptionsMap, TModuleParams } from '../../../types/common.js';
import { eta } from '../../eta.js';
import { ModuleNames } from '../index.js';
import { PureJavaScriptCodegen } from '../PureJavaScript/index.js';

export class PureTypeScriptCodegen extends PureJavaScriptCodegen implements ICodegen<typeof ModuleNames.PureTypeScript> {
	constructor(params: TModuleParams) {
		super(params);
	}

	// pure-ts .js output is identical to pure-js
	public override getCode(options: TGetCodeOptionsMap[typeof ModuleNames.PureTypeScript]): string {
		const it = this.buildTemplateModel(options.className);
		const rendered = eta.render('pure-js/module.eta', it);
		if (rendered == null) throw new Error('Eta render returned null/undefined for pure-js/module');
		return rendered;
	}

	public override getFiles(options: TGetCodeOptionsMap[typeof ModuleNames.PureTypeScript]): TCodegenFiles {
		const jsFiles = super.getFiles(options);

		const it = { ...this.buildTemplateModel(options.className), hasTypes: true };
		const dtsContent = eta.render('pure-ts/declarations.eta', it);
		if (dtsContent == null) throw new Error('Eta render returned null/undefined for pure-ts/declarations');

		return {
			...jsFiles,
			[`${options.className}.d.ts`]: dtsContent,
		};
	}
}
