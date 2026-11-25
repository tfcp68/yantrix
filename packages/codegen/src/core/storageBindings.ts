import { eta } from './eta.js';
import { ModuleNames } from './modules/index.js';

/** @see {@link IStorageBindingDefinition} */
export interface IStorageModuleExport {
	/** @example `"./storage/memory.js"` */
	module: string;
	/** @example `"connect"` */
	exportName: string;
}

/** @see {@link IGenerateStorageBindingsOptions} */
export interface IStorageBindingDefinition {
	/** @example `"user-preferences"` */
	name: string;
	/** @example `{ module: "./storage/memory.js", exportName: "connect" }` */
	connector: IStorageModuleExport & {
		/** Pass the mapper's projected snapshot type to a generic connector factory. */
		snapshotTypeArgument?: boolean;
	};
	/** @example `{ module: "./preferences.js", exportName: "preferencesMapper" }` */
	mapper: IStorageModuleExport;
}

/** @see {@link generateStorageBindings} */
export interface IGenerateStorageBindingsOptions {
	/** @see {@link IStorageBindingDefinition} */
	bindings: readonly IStorageBindingDefinition[];
	/** @defaultValue `"typescript"` */
	outLang?: typeof ModuleNames.TypeScript | typeof ModuleNames.JavaScript | typeof ModuleNames.Python;
}

const exportIdentifier = /^[$_\p{ID_Start}][$\u200C\u200D\p{ID_Continue}]*$/u;
const pythonIdentifier = /^[_\p{XID_Start}]\p{XID_Continue}*$/u;
const pythonKeywords = new Set((
	'False None True and as assert async await break class continue def del elif else except finally for from '
	+ 'global if import in is lambda nonlocal not or pass raise return try while with yield'
).split(' '));

function isPythonIdentifier(name: string): boolean {
	return pythonIdentifier.test(name) && !pythonKeywords.has(name);
}

function validateModuleExport(reference: IStorageModuleExport, role: string, binding: string, python: boolean): void {
	if (typeof reference?.module !== 'string' || !reference.module.trim())
		throw new TypeError(`Missing ${role} module for storage binding ${JSON.stringify(binding)}`);
	if (python) {
		const moduleName = reference.module.replace(/^\.+/, '');
		if (moduleName && !moduleName.split('.').every(isPythonIdentifier))
			throw new TypeError(`Invalid Python ${role} module for storage binding ${JSON.stringify(binding)}`);
	}
	const { exportName } = reference;
	if (typeof exportName !== 'string' || !(python ? isPythonIdentifier(exportName) : exportIdentifier.test(exportName)))
		throw new TypeError(`Invalid ${role} export name for storage binding ${JSON.stringify(binding)}`);
}

/**
 * Outputs a module that imports the selected `Storage` connector factories and
 * mappers. The generated factory accepts each connector’s arguments at runtime.
 */
export function generateStorageBindings({
	bindings,
	outLang = ModuleNames.TypeScript,
}: IGenerateStorageBindingsOptions): string {
	const python = outLang === ModuleNames.Python;
	if (outLang !== ModuleNames.TypeScript && outLang !== ModuleNames.JavaScript && !python)
		throw new TypeError(`Unsupported storage bindings language: ${outLang}`);

	const names = new Set<string>();
	for (const { name, connector, mapper } of bindings) {
		if (typeof name !== 'string' || !name.trim())
			throw new TypeError('Storage binding names must be non-empty strings');
		if (names.has(name))
			throw new TypeError(`Duplicate storage binding name: ${JSON.stringify(name)}`);
		names.add(name);
		validateModuleExport(connector, 'connector', name, python);
		validateModuleExport(mapper, 'mapper', name, python);
	}
	if (python) return eta.render('python/storage/bindings.eta', { bindings });
	return eta.render('js/shared/storage/bindings.eta', { bindings, hasTypes: outLang === ModuleNames.TypeScript });
}
