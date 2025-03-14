import { ICodegenOptions, TStateDiagramMatrixIncludeNotes } from '../types/common.js';
import { processFile } from './InjectFunctionsProcess.js';
import { Modules } from './modules/index.js';

export class CodegenCreator {
	public constructor(
		protected stateDiagramSyntaxTree: TStateDiagramMatrixIncludeNotes,

	) {}

	public async createCodegen(options: ICodegenOptions) {
		const injectedFunctions = await processFile(options.language)(options.functionFilePath);

		return new Modules[options.language]({ diagram: this.stateDiagramSyntaxTree, constants: options.constants, injectedFunctions });
	}
}
