import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getAllReferencedFunctions, YantrixParser } from '@yantrix/yantrix-parser';
import { ICodegen, TCodegenFiles, TGetCodeOptionsMap, TModuleParams } from '../../../types/common.js';
import { eta, etaViewsPath } from '../../eta.js';
import { ModuleNames } from '../index.js';
import { JavaScriptCodegen } from '../JavaScript/index.js';

// alias -> canonical block name (both registered inside the same @@begin block)
const BUILTIN_ALIASES: Record<string, string> = { all: 'and', any: 'or' };

// block X calls a function defined in block Y
const BUILTIN_INTERNAL_DEPS: Record<string, string[]> = {
	isOdd: ['isEven'],
	inc: ['add'],
	dec: ['add'],
	neg: ['mult'],
	inv: ['div'],
	log: ['ln'],
	lg: ['log'],
	avg: ['sum'],
	sumProduct: ['sum', 'mult'],
};

function expandWithDeps(used: Set<string>): Set<string> {
	const result = new Set<string>();
	for (const name of used) {
		result.add(BUILTIN_ALIASES[name] ?? name);
	}
	const queue = [...result];
	while (queue.length > 0) {
		const name = queue.shift()!;
		for (const dep of BUILTIN_INTERNAL_DEPS[name] ?? []) {
			if (!result.has(dep)) {
				result.add(dep);
				queue.push(dep);
			}
		}
	}
	return result;
}

function filterBuiltinsJS(raw: string, used: Set<string>): string {
	const lines = raw.split('\n');
	const out: string[] = [];
	let inBlock = false;
	let blockIncluded = false;
	let preambleDone = false;

	for (const line of lines) {
		const begin = line.match(/^\/\/ @@begin: (.+)$/);
		const end = line.match(/^\/\/ @@end: (.+)$/);
		if (begin) {
			preambleDone = true;
			blockIncluded = used.has(begin[1]!.trim());
			inBlock = true;
			if (blockIncluded) out.push(line);
			continue;
		}
		if (end) {
			if (blockIncluded) out.push(line);
			inBlock = false;
			blockIncluded = false;
			continue;
		}
		if (!preambleDone || (inBlock && blockIncluded)) {
			out.push(line);
		}
	}
	return `${out.join('\n')}\n`;
}

export class PureJavaScriptCodegen extends JavaScriptCodegen implements ICodegen<typeof ModuleNames.PureJavaScript> {
	constructor(params: TModuleParams) {
		super(params);
		// clear npm imports; importNamespaces kept for inject-functions namespace import
		this.imports = {};
	}

	protected override buildTemplateModel(className: string) {
		const base = super.buildTemplateModel(className);
		const rawBuiltins = readFileSync(resolve(etaViewsPath, 'pure-js/runtime/builtins.js.tpl'), 'utf8');

		let builtins: string;
		if (this.injectedPath) {
			builtins = rawBuiltins;
		} else {
			const userDefined = new Set([
				...this.defines.map(d => d.identifier),
				...this.injects.map(i => i.identifier),
			]);
			const usedBuiltins = new Set<string>();
			const _parser = new YantrixParser();
			for (const state of this.diagram.states) {
				if (state.notes) {
					for (const name of getAllReferencedFunctions(state.notes)) {
						if (!userDefined.has(name)) usedBuiltins.add(name);
					}
				}
			}
			// scan fork conditions in actionChains
			for (const stateActions of Object.values(this.diagram.actionChains)) {
				for (const { chains } of Object.values(stateActions)) {
					for (const { chain } of chains) {
						for (const segment of chain) {
							try {
								const doc = _parser.parse(`=${segment}?`);
								for (const name of getAllReferencedFunctions(doc)) {
									if (!userDefined.has(name)) usedBuiltins.add(name);
								}
							} catch { /* non-parseable segments resolve to true, skip */ }
						}
					}
				}
			}
			builtins = filterBuiltinsJS(rawBuiltins, expandWithDeps(usedBuiltins));
		}

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
