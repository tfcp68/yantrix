/**
 * @packageDocumentation
 *
 * The `@yantrix/codegen` package is a code generation engine for the Yantrix framework,
 * designed to transform extended Mermaid state diagrams into type-safe finite state machine implementations.
 *
 * You can check the supported languages and features [here](/integrations/100_language_support.html).
 *
 */

import { TStateDiagramMatrix } from '@yantrix/mermaid-parser';
import { YantrixParser } from '@yantrix/yantrix-parser';
import { CodegenCreator } from './core/Codegen.js';
import { ModuleNames } from './core/modules/index.js';
import { formatByDialect, formatByFilename } from './postprocess.js';
import { IGenerateOptions, TCodegenFiles, TStateIncludingNotes } from './types/common.js';

export * from './core/modules/index.js';
export * from './types/common.js';

/**
 * Main function that's used to asynchronously generate Yantrix FSMs.
 * @param diagram - The state diagram, processed by Mermaid & Yantrix Parsers (`mermaid-parser`, `yantrix-parser`)
 * @param options - Options for configuring the generation process, such as the output language and automata class name
 * @returns - A promise with the code of generated FSM as string
 */
export async function generateAutomataFromStateDiagram(diagram: TStateDiagramMatrix, options: IGenerateOptions): Promise<string> {
	const { states, transitions, actionChains } = diagram;
	const parserInstance = new YantrixParser();

	const statesIncludingNotes = states.map((state) => {
		const input = state.notes.flatMap(e => e.join('\n')).join(' ');
		if (input === '')
			return { ...state, notes: null };
		return { ...state, notes: parserInstance.parse(input) } as TStateIncludingNotes;
	});

	let constants: Record<string, any> | null = null;

	if (options?.constants) {
		constants = JSON.parse(options.constants);
	}

	if (constants !== null) {
		Object.entries(constants).forEach(([key, value]) => {
			if (typeof value !== 'string' && typeof value !== 'number') {
				throw new TypeError(`Invalid constant value type. Key: ${key}, value: ${JSON.stringify(value)}`);
			}
		});
	}

	const creator = new CodegenCreator(
		{
			states: statesIncludingNotes,
			transitions,
			actionChains,
		},
	);

	const codegen = await creator.createCodegen({
		language: options.outLang ?? ModuleNames.TypeScript,
		constants,
		functionFilePath: options.functionFilePath ?? null,
	});

	const code = codegen.getCode(options);
	const dialect = options.outLang ?? ModuleNames.TypeScript;
	return options.beautify ? formatByDialect(code, dialect) : Promise.resolve(code);
}

/**
 * Generates a Yantrix FSM as a map of filenames to content (multi-file output).
 * Dialects that implement `getFiles()` (e.g. pure-javascript, pure-typescript) return
 * multiple files; all other dialects return a single-entry map keyed by the main filename.
 */
export async function generateAutomataFiles(diagram: TStateDiagramMatrix, options: IGenerateOptions): Promise<TCodegenFiles> {
	const { states, transitions, actionChains } = diagram;
	const parserInstance = new YantrixParser();

	const statesIncludingNotes = states.map((state) => {
		const input = state.notes.flatMap(e => e.join('\n')).join(' ');
		if (input === '')
			return { ...state, notes: null };
		return { ...state, notes: parserInstance.parse(input) } as TStateIncludingNotes;
	});

	let constants: Record<string, any> | null = null;
	if (options?.constants) {
		constants = JSON.parse(options.constants);
	}
	if (constants !== null) {
		Object.entries(constants).forEach(([key, value]) => {
			if (typeof value !== 'string' && typeof value !== 'number') {
				throw new TypeError(`Invalid constant value type. Key: ${key}, value: ${JSON.stringify(value)}`);
			}
		});
	}

	const creator = new CodegenCreator({ states: statesIncludingNotes, transitions, actionChains });
	const codegen = await creator.createCodegen({
		language: options.outLang ?? ModuleNames.TypeScript,
		constants,
		functionFilePath: options.functionFilePath ?? null,
	});

	let rawFiles: TCodegenFiles;
	if ('getFiles' in codegen && typeof (codegen as any).getFiles === 'function') {
		rawFiles = (codegen as any).getFiles(options) as TCodegenFiles;
	} else {
		const lang = options.outLang ?? ModuleNames.TypeScript;
		const extMap: Record<string, string> = {
			'javascript': 'js',
			'typescript': 'ts',
			'python': 'py',
			'java': 'java',
			'pure-javascript': 'js',
			'pure-typescript': 'js',
		};
		const ext = extMap[lang] ?? 'txt';
		rawFiles = { [`${options.className}.${ext}`]: codegen.getCode(options) };
	}

	if (!options.beautify) return rawFiles;

	const formatted: TCodegenFiles = {};
	for (const [filename, content] of Object.entries(rawFiles)) {
		formatted[filename] = await formatByFilename(content, filename);
	}
	return formatted;
}
