import { IGenerateOptions, TStateIncludingNotes } from './types/common.js';

import { TStateDiagramMatrix } from '@yantrix/mermaid-parser';
import { YantrixParser } from '@yantrix/yantrix-parser';
import { CodegenCreator } from './core/Codegen.js';

export * from './core/modules/index.js';
export * from './types/common.js';

export const generateAutomataFromStateDiagram = async (diagram: TStateDiagramMatrix, options: IGenerateOptions) => {
	const { states, transitions } = diagram;
	const parserInstance = new YantrixParser();

	const statesIncludingNotes = states.map((state) => {
		const input = state.notes.flatMap((e) => e.join('\n')).join(' ');
		if (input === '') return { ...state, notes: null };
		return { ...state, notes: parserInstance.parse(input) } as TStateIncludingNotes;
	});

	const creator = new CodegenCreator({
		states: statesIncludingNotes,
		transitions,
	});

	const codegen = creator.createCodegen({
		language: options.outLang ?? 'TypeScript',
	});

	return codegen.getCode(options);
};

export const generateJavaAutomata = async (diagram: TStateDiagramMatrix, options: IGenerateOptions) => {
	const { states, transitions } = diagram;
	const parserInstance = new YantrixParser();

	const statesIncludingNotes = states.map((state) => {
		const input = state.notes.flatMap((e) => e.join('\n')).join(' ');
		if (input === '') return { ...state, notes: null };
		return { ...state, notes: parserInstance.parse(input) } as TStateIncludingNotes;
	});

	const creator = new CodegenCreator({
		states: statesIncludingNotes,
		transitions,
	});

	const codegen = creator.createCodegen({
		language: options.outLang ?? 'Java',
	});

	return [codegen.getImports(), codegen.getClassTemplate(options.className)].join('\n');
};
