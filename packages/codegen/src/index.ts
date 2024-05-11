import { codegens } from './codegens/index.js';
import {
  ICodegenOptions,
  TCodegenType,
  TStateDiagramSyntaxTree,
} from './types.js';
import { fmt } from './utils.js';
import { createStateDiagram, parseStateDiagram } from '@yantrix/mermaid-parser';
import { TNotes, YantrixParser } from '@yantrix/yantrix-parser';

export const generate = async (
  diagramText: string,
  options: ICodegenOptions,
  codeType: TCodegenType = 'TypeScript',
) => {
  const parsedDiagram = await parseStateDiagram(diagramText);

  const stateDiagram = await createStateDiagram(parsedDiagram);
  const yantrixParser = new YantrixParser();

  const syntaxTree: TStateDiagramSyntaxTree = {
    ...stateDiagram,
    notes: parsedDiagram.notes.map((note) => {
      return {
        state: note.over === '[*]' ? '/~~~START~~~' : note.over,
        dict: yantrixParser.parse(note.text.join('')) as TNotes,
      };
    }),
  };

  const codegen = new codegens[codeType](syntaxTree);

  return fmt(
    [
      codegen.getImports(),
      ...codegen.dictionaries,
      ...codegen.changeStateHandlers,
      ...codegen.handlersDict,
      codegen.getClassTemplate(options.className),
    ].join('\n'),
  );
};
