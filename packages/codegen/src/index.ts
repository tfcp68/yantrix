import type { TStateDiagram } from '@yantrix/mermaid-parser';
import type { ICodegenOptions } from './types.js';
import { format } from 'prettier';
import { join } from 'path';
import { cwd } from 'process';
import { readFile } from 'fs/promises';
import { Codegen } from './utils.js';

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
) => {
  const codegen = new Codegen(diagram);
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
