import { execSync } from 'node:child_process';
import prettier from 'prettier';
import { ModuleNames } from './core/modules/index.js';
import { TOutLang } from './types/common.js';

const UNIVERSAL = {
	printWidth: 100,
	tabWidth: 4,
	useTabs: true,
	trailingComma: 'all' as const,
};

const EXT_PARSER: Record<string, 'babel' | 'typescript'> = {
	'.js': 'babel',
	'.ts': 'typescript',
	'.d.ts': 'typescript',
};

async function formatJS(code: string, parser: 'babel' | 'typescript'): Promise<string> {
	try {
		return await prettier.format(code, { ...UNIVERSAL, parser });
	} catch {
		return code;
	}
}

function formatPython(code: string): Promise<string> {
	return new Promise((resolve) => {
		try {
			const result = execSync('ruff format --line-length 100 -', {
				input: code,
				encoding: 'utf8',
			});
			resolve(result);
		} catch {
			console.warn('[yantrix codegen] ruff not found in PATH - Python output will not be formatted');
			resolve(code);
		}
	});
}

const FORMAT_BY_DIALECT: Record<TOutLang, (code: string) => Promise<string>> = {
	[ModuleNames.JavaScript]: (code) => formatJS(code, 'babel'),
	[ModuleNames.TypeScript]: (code) => formatJS(code, 'typescript'),
	[ModuleNames.Python]: formatPython,
	[ModuleNames.Java]: (code) => formatJS(code, 'babel'),
	[ModuleNames.PureJavaScript]: (code) => formatJS(code, 'babel'),
	[ModuleNames.PureTypeScript]: (code) => formatJS(code, 'typescript'),
};

export function formatByDialect(dialect: TOutLang): (code: string) => Promise<string> {
	return FORMAT_BY_DIALECT[dialect];
}

export async function formatByFilename(code: string, filename: string): Promise<string> {
	if (filename.endsWith('.py')) return formatPython(code);
	const ext = filename.endsWith('.d.ts') ? '.d.ts' : filename.slice(filename.lastIndexOf('.'));
	const parser = EXT_PARSER[ext];
	if (!parser) return code;
	return formatJS(code, parser);
}
