import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ICodegen, TCodegenFiles, TGetCodeOptionsMap, TModuleParams } from '../../../types/common.js';
import { eta, etaViewsPath } from '../../eta.js';
import { ModuleNames } from '../index.js';
import { JavaScriptCodegen } from '../JavaScript/index.js';

export class PureJavaScriptCodegen extends JavaScriptCodegen implements ICodegen<typeof ModuleNames.PureJavaScript> {
	constructor(params: TModuleParams) {
		super(params);
		// clear npm imports; importNamespaces kept for inject-functions namespace import
		this.imports = {};
	}

	protected override buildTemplateModel(className: string) {
		const base = super.buildTemplateModel(className);
		const builtins = readFileSync(resolve(etaViewsPath, 'pure-js/runtime/builtins.js.tpl'), 'utf8');
		return { ...base, builtins };
	}

	public override getCode(options: TGetCodeOptionsMap[typeof ModuleNames.PureJavaScript]): string {
		const it = this.buildTemplateModel(options.className);
		const rendered = eta.render('pure-js/module.eta', it);
		if (rendered == null) throw new Error('Eta render returned null/undefined for pure-js/module');
		return rendered;
	}

	public getFiles(options: TGetCodeOptionsMap[typeof ModuleNames.PureJavaScript]): TCodegenFiles {
		const it = this.buildTemplateModel(options.className);

		const runtimeContent = eta.render('pure-js/runtime/standalone.eta', it);
		if (runtimeContent == null) throw new Error('Eta render returned null/undefined for pure-js/runtime/standalone');

		const automataContent = eta.render('pure-js/automata.eta', it);
		if (automataContent == null) throw new Error('Eta render returned null/undefined for pure-js/automata');

		return {
			'runtime.js': runtimeContent,
			[`${options.className}.js`]: automataContent,
		};
	}
}
