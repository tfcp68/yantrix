import { ICodegenOptions, TStateDiagramSyntaxTree } from '../types/common.js';
import { Modules } from './modules/index.js';

export class CodegenCreator {
	public constructor(protected stateDiagramSyntaxTree: TStateDiagramSyntaxTree) {}

	public createCodegen(options: ICodegenOptions) {
		console.log(Modules);
		return new Modules[options.language](this.stateDiagramSyntaxTree);
	}
}
