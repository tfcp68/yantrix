import { ICodegenOptions, TStateDiagramMatrixIncludeNotes } from '../types/common.js';
import { Modules } from './modules/index.js';

export class CodegenCreator {
	public constructor(protected stateDiagramSyntaxTree: TStateDiagramMatrixIncludeNotes) {}

	public createCodegen(options: ICodegenOptions) {
		return new Modules[options.language](this.stateDiagramSyntaxTree);
	}
}
