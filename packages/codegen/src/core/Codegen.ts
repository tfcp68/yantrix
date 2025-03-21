import { ICodegenOptions, TConstants, TStateDiagramMatrixIncludeNotes } from '../types/common.js';
import { Modules } from './modules/index.js';

/**
 * ???
 */
export class CodegenCreator {
	public constructor(
		protected stateDiagramSyntaxTree: TStateDiagramMatrixIncludeNotes,
		protected constants: TConstants | null,
	) {}

	public createCodegen(options: ICodegenOptions) {
		return new Modules[options.language]({ diagram: this.stateDiagramSyntaxTree, constants: this.constants });
	}
}
