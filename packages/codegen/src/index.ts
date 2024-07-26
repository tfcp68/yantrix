import { IGenerateOptions, TStateIncludingNotes } from './types/common.js';
import { fmt } from './utils/utils.js';
import { CodegenCreator } from './core/Codegen.js';
import { TStateDiagramMatrix } from '@yantrix/mermaid-parser';
import { YantrixParser } from '@yantrix/yantrix-parser';

export * from './types/common.js';
export * from './core/modules/index.js';

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

	return [
		codegen.getImports(),
		codegen.getDictionaries(),
		codegen.getDefaultContext(),
		codegen.getActionToStateFromState(),
		codegen.getClassTemplate(options.className),
	].join('\n');
};
