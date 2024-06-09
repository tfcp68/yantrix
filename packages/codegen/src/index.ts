import { IGenerateOptions, TStateDiagramSyntaxTree } from './types/common.js';
import { CodegenCreator } from './core/Codegen.js';

export { fmt } from './utils/utils.js';
export const generateAutomataFromStateDiagram = async (diagram: TStateDiagramSyntaxTree, options: IGenerateOptions) => {
	const creator = new CodegenCreator(diagram);
	const codegen = creator.createCodegen({
		language: options.outLang ?? 'TypeScript',
	});

	return [
		codegen.getImports(),
		codegen.getDictionaries(),
		codegen.getActionToStateFromState(),
		codegen.getClassTemplate(options.className),
	].join('\n');
};
