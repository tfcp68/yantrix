import Default_Predicates from './functions/Predicates';
import Default_Conditionals from './functions/Conditionals';
import Default_Transformers from './functions/Transformers';

export class FunctionDictionary {
	private functions: Record<string, any> = {
		...Default_Predicates,
		...Default_Conditionals,
		...Default_Transformers,
	};

	setFunction(functionKey: string, callback: (...args: any) => any) {
		this.functions[functionKey] = callback;
	}

	getFunction(functionKey: string) {
		return this.functions[functionKey];
	}
}
