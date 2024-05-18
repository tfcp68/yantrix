import type { TStateDiagram } from '@yantrix/mermaid-parser';
import { codegens } from './codegens/index.js';
import { ICodegenOptions, TCodegenType } from './types.js';
import { fmt } from './utils.js';

export const generate = async (
  diagram: TStateDiagram,
  options: ICodegenOptions,
  codeType: TCodegenType = 'TypeScript',
) => {
  const codegen = new codegens[codeType](diagram);

  return fmt(
    [
      codegen.getImports(),
      codegen.getDictionaries(),
      codegen.getChangeStateHandlers(),
      codegen.getHandlers(),
      codegen.getClassTemplate(options.className),
    ].join('\n'),
  );
};
