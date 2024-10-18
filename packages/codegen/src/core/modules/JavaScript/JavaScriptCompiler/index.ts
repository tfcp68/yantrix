import { classModule } from './class';
import { context } from './context';
import { dictionaries } from './dictionaries';
import { expressions } from './expressions';
import { imports } from './imports';
import { state } from './state';

export const JavaScriptCompiler = {
	class: classModule,
	context,
	dictionaries,
	expressions,
	imports,
	state,
};
