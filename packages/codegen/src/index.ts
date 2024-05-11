import type { TStateDiagram } from '@yantrix/mermaid-parser';
import type { ICodegenOptions } from './types/common.js';
import { Codegen } from './core/Codegen.js';
import { fmt } from './utils/utils.js';

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
