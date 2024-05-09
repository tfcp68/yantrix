import type { TStateDiagram } from '@yantrix/mermaid-parser';
import { codegens } from './codegens/index.js';
import { ICodegenOptions, TCodegenType } from './types.js';
import { getGenerationCodeOutput } from './utils.js';

export const generate = async (
  diagram: TStateDiagram,
  options: ICodegenOptions,
  codeType: TCodegenType = 'TypeScript',
) => {
  return getGenerationCodeOutput[codeType](
    new codegens[codeType](diagram),
    options,
  );
};
