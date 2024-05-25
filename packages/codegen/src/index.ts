import { IGenerateOptions, TStateDiagramSyntaxTree } from './types/common.js';
import { CodegenCreator, getOutputByLanguage } from './core/Codegen.js';

export const generateAutomataFromStateDiagram = async (diagram: TStateDiagramSyntaxTree, options: IGenerateOptions) => {
	const creator = new CodegenCreator(diagram);
	const codegen = creator.createCodegen({
		language: options.outLang ?? 'TypeScript',
	});

	return getOutputByLanguage(codegen, options);
};
