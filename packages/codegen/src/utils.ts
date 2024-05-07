import { ICodegen, ICodegenOptions, TCodegenType } from './types.js';

export const getGenerationCodeOutput = {
  JavaScript: (codegen, options) => {
    const output = [
      ...codegen.dictionaries,
      ...codegen.changeStateHandlers,
      ...codegen.handlersDict,
      codegen.getClassTemplate(options.className),
    ].join('\n');
    return output;
  },
  TypeScript: (...args) => {
    return getGenerationCodeOutput.JavaScript(...args);
  },
} as Record<
  TCodegenType,
  (codegen: ICodegen, options: ICodegenOptions) => string
>;
