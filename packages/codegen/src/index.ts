import type { TStateDiagramMatrix } from '@yantrix/mermaid-parser'
import { YantrixParser } from '@yantrix/yantrix-parser'
import type { IGenerateOptions, TStateIncludingNotes } from './types/common.js'
import { CodegenCreator } from './core/Codegen.js'

export * from './core/modules/index.js'
export * from './types/common.js'

export * from './builtins/index.js'

export async function generateAutomataFromStateDiagram(diagram: TStateDiagramMatrix, options: IGenerateOptions): Promise<string> {
	const { states, transitions } = diagram
	const parserInstance = new YantrixParser()

	const statesIncludingNotes = states.map((state) => {
		const input = state.notes.flatMap(e => e.join('\n')).join(' ')
		if (input === '')
			return { ...state, notes: null }
		return { ...state, notes: parserInstance.parse(input) } as TStateIncludingNotes
	})

	const creator = new CodegenCreator({
		states: statesIncludingNotes,
		transitions,
	})

	const codegen = creator.createCodegen({
		language: options.outLang ?? 'TypeScript',
	})

	return codegen.getCode(options)
}
