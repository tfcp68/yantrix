import type { TStateDiagram } from '@yantrix/mermaid-parser';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { format } from 'prettier';
import { cwd } from 'process';
import { codegens } from './codegens/index.js';
import { ICodegenOptions, TCodegenType } from './types.js';
import { getGenerationCodeOutput } from './utils.js';

const prettierCfgPath = join(cwd(), '.prettierrc');
const fmt = async (code: string) => {
  try {
    const prettierCfgRaw = await readFile(prettierCfgPath, 'utf-8');
    const prettierCfg = JSON.parse(prettierCfgRaw);
    return format(code, { ...prettierCfg, parser: 'babel-ts' });
  } catch {
    return code;
  }
};

export const generate = async (
  diagram: TStateDiagram,
  options: ICodegenOptions,
  codeType: TCodegenType = 'TypeScript',
) => {
  const codegen = new codegens[codeType](diagram);

  return fmt(`
  import { GenericAutomata } from "@yantrix/automata";
  
  ${getGenerationCodeOutput[codeType](codegen, options)}
 
  `);
};

export const createGenerator = (codeType: TCodegenType) => {
  return {
    generate: async (diagram: TStateDiagram, options: ICodegenOptions) => {
      return generate(diagram, options, codeType);
    },
  };
};
