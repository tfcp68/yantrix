import type { TStateDiagram } from '@yantrix/mermaid-parser';
import { ICodegenOptions, TCodegenType } from './types.js';
import { format } from 'prettier';
import { join } from 'path';
import { cwd } from 'process';
import { readFile } from 'fs/promises';
import codegens from './codegens/index.js';

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
  codeType: TCodegenType,
) => {
  const codegen = new codegens[codeType](diagram);
  const output = [
    ...codegen.dictionaries,
    ...codegen.changeStateHandlers,
    ...codegen.handlersDict,
    codegen.getClassTemplate(options.className),
  ].join('\n');

  return fmt(`
  	import { GenericAutomata } from "@yantrix/automata";
  	
    ${output}
   
  `);
};

export const createGenerator = (codeType: TCodegenType) => {
  return {
    generate: async (diagram: TStateDiagram, options: ICodegenOptions) => {
      return generate(diagram, options, codeType);
    },
  };
};
