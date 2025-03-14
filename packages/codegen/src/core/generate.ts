import { TStateDiagramMatrix } from '@yantrix/mermaid-parser';
import { YantrixParser } from '@yantrix/yantrix-parser';
import { IGenerateOptions, TStateIncludingNotes } from '../types/common';
import { CodegenCreator } from './Codegen';
import { ModuleNames } from './modules';

async function generateAutomataFromStateDiagram(diagram: TStateDiagramMatrix, options: IGenerateOptions): Promise<string> {
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

	return codegen.getCode(options);
}

export { generateAutomataFromStateDiagram };
