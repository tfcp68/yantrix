import Default_Predicates from './functions/Predicates.js';
import Default_Conditionals from './functions/Conditionals.js';
import Default_Transformers from './functions/Transformers.js';

type AutomataFunction = (...args: any) => any;

export class FunctionDictionary {
	private functions: Record<string, AutomataFunction> = {
		...Default_Predicates,
		...Default_Conditionals,
		...Default_Transformers,
	};

	setFunction(functionKey: string, callback: AutomataFunction) {
		this.functions[functionKey] = callback;
	}

	getFunction(functionKey: string): AutomataFunction {
		return this.functions[functionKey];
	}

	getDictionary() {
		return `{
			${Object.keys(this.functions).map((func) => `${func}: ${this.functions[func].toString()}`)}
		}`;
	}
}
