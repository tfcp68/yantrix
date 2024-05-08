import type { TStateDiagram } from '@yantrix/mermaid-parser';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { format } from 'prettier';
import { cwd } from 'process';
import { codegens } from './codegens/index.js';
import { ICodegen, ICodegenOptions, TCodegenType } from './types.js';

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

  const getGenerationCodeOutput = {
    JavaScript: (codegen, options) => {
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
    },
    TypeScript: (...args) => {
      return getGenerationCodeOutput.JavaScript(...args);
    },
  } as Record<
    TCodegenType,
    (codegen: ICodegen, options: ICodegenOptions) => Promise<string>
  >;

  return getGenerationCodeOutput[codeType](codegen, options);
};

export const createGenerator = (codeType: TCodegenType) => {
  return {
    generate: async (diagram: TStateDiagram, options: ICodegenOptions) => {
      return generate(diagram, options, codeType);
    },
  };
};
