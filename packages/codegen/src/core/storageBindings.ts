import { eta } from './eta.js';
import { ModuleNames } from './modules/index.js';

export interface IStorageModuleExport {
	module: string;
	exportName: string;
}

export interface IStorageBindingDefinition {
	name: string;
	connector: IStorageModuleExport;
	mapper: IStorageModuleExport;
}

export interface IGenerateStorageBindingsOptions {
	bindings: readonly IStorageBindingDefinition[];
	outLang?: typeof ModuleNames.TypeScript | typeof ModuleNames.JavaScript;
}

const exportIdentifier = /^[$_\p{ID_Start}][$\u200C\u200D\p{ID_Continue}]*$/u;

function validateModuleExport(reference: IStorageModuleExport, role: string, binding: string): void {
	if (typeof reference?.module !== 'string' || !reference.module.trim())
		throw new TypeError(`Missing ${role} module for storage binding ${JSON.stringify(binding)}`);
	if (typeof reference.exportName !== 'string' || !exportIdentifier.test(reference.exportName))
		throw new TypeError(`Invalid ${role} export name for storage binding ${JSON.stringify(binding)}`);
}

export function generateStorageBindings({
	bindings,
	outLang = ModuleNames.TypeScript,
}: IGenerateStorageBindingsOptions): string {
	if (outLang !== ModuleNames.TypeScript && outLang !== ModuleNames.JavaScript)
		throw new TypeError(`Unsupported storage bindings language: ${outLang}`);

	const names = new Set<string>();
	for (const { name, connector, mapper } of bindings) {
		if (typeof name !== 'string' || !name.trim())
			throw new TypeError('Storage binding names must be non-empty strings');
		if (names.has(name))
			throw new TypeError(`Duplicate storage binding name: ${JSON.stringify(name)}`);
		names.add(name);
		validateModuleExport(connector, 'connector', name);
		validateModuleExport(mapper, 'mapper', name);
	}
	return eta.render('storage/bindings.eta', { bindings, hasTypes: outLang === ModuleNames.TypeScript });
}
