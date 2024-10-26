import { JavaScriptCompiler } from '../../JavaScript';
import { classModule } from './class';
import { types } from './types';

export const TypeScriptCompiler = {
	class: classModule,
	context: JavaScriptCompiler.context,
	dictionaries: JavaScriptCompiler.dictionaries,
	expressions: JavaScriptCompiler.expressions,
	imports: JavaScriptCompiler.imports,
	state: JavaScriptCompiler.state,
	types,
};
