import { JavaScriptCompiler } from '../../JavaScript';
import { classModule } from './class';
import { dictionaries } from './dictionaries';

export const TypeScriptCompiler = {
	class: classModule,
	context: JavaScriptCompiler.context,
	dictionaries,
	expressions: JavaScriptCompiler.expressions,
	imports: JavaScriptCompiler.imports,
	state: JavaScriptCompiler.state,
};
