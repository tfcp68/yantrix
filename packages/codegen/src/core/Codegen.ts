import { ICodegen, ICodegenOptions, IGenerateOptions, TOutLang, TStateDiagramSyntaxTree } from '../types/common.js';
import { Modules } from './modules/index.js';
import { fmt } from '../utils/utils.js';

export class CodegenCreator {
	public constructor(private stateDiagramSyntaxTree: TStateDiagramSyntaxTree) {}

	public createCodegen(options: ICodegenOptions) {
		return new Modules[options.language](this.stateDiagramSyntaxTree);
	}
}

const codegenArrayOutputByLanguage = {
	JavaScript: (codegen, options) => {
		return [
			codegen.getImports(),
			codegen.getDictionaries(),
			codegen.getActionToStateFromState(),
			codegen.getClassTemplate(options.className),
		];
	},
	TypeScript: (codegen, options) => {
		const code = codegenArrayOutputByLanguage.JavaScript(codegen, options);
		if (codegen.getUtils) code.push(codegen.getUtils());
		return code;
	},
} as Record<TOutLang, (codegen: ICodegen, options: IGenerateOptions) => string[]>;

const formatOutputByLanguage = {
	JavaScript: (output: string) => fmt(output),
	TypeScript: (output: string) => formatOutputByLanguage.JavaScript(output),
} as Record<TOutLang, (output: string) => Promise<string>>;

export const getOutputByLanguage = (codegen: ICodegen, options: IGenerateOptions) => {
	const code = codegenArrayOutputByLanguage[options.outLang](codegen, options).join('\n');
	return formatOutputByLanguage[options.outLang](code);
};
