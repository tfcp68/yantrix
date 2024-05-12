import { ICodegenOptions, TStateDiagramSyntaxTree } from '../types/common.js';
import { Modules } from './modules/index.js';

export class CodegenCreator {
  public constructor(private stateDiagramSyntaxTree: TStateDiagramSyntaxTree) {}

  public createCodegen(options: ICodegenOptions) {
    return new Modules[options.language](this.stateDiagramSyntaxTree);
  }
}
