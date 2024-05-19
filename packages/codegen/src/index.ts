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
			...codegen.dictionaries,
			...codegen.changeStateHandlers,
			...codegen.handlersDict,
			codegen.getClassTemplate(options.className),
		].join('\n'),
	);
};
