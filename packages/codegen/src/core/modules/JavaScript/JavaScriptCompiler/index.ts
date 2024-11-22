import { classModule } from './class';
import { context } from './context';
import { dictionaries } from './dictionaries';
import { events } from './events';
import { expressions } from './expressions';
import { forks } from './forks';
import { imports } from './imports';
import { state } from './state';

export const JavaScriptCompiler = {
	class: classModule,
	context,
	dictionaries,
	expressions,
	imports,
	state,
	events,
	forks,
};
