import { IGenerateOptions, TStateDiagramSyntaxTree } from './types/common.js';
import { fmt } from './utils/utils.js';
import { CodegenCreator } from './core/Codegen.js';

export const generateAutomataFromStateDiagram = async (diagram: TStateDiagramSyntaxTree, options: IGenerateOptions) => {
	const creator = new CodegenCreator(diagram);
	const codegen = creator.createCodegen({
		language: options.outLang ?? 'TypeScript',
	});

	return fmt(
		[
			codegen.getImports(),
			...codegen.dictionaries,
			...codegen.changeStateHandlers,
			...codegen.handlersDict,
			codegen.getClassTemplate(options.className),
		].join('\n'),
	);
};
