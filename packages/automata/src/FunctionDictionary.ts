type AutomataFunction = (...args: any) => any; // ?

export class FunctionDictionary {
	private functions: Record<string, AutomataFunction>;

	constructor(functions: Record<string, AutomataFunction>) {
		this.functions = functions;
	}

	setFunction(functionKey: string, callback: AutomataFunction) {
		// only set a function if its not present in dictionary to avoid overwrites of basic built-in functions
		if (!this.functions[functionKey]) {
			this.functions[functionKey] = callback;
		} else {
			// throw error?
		}
	}

	getFunction(functionKey: string): AutomataFunction {
		// if not present - throw error ?
		return this.functions[functionKey];
	}

	// text representation for codegen
	getDictionary() {
		return `{
			${Object.keys(this.functions).map((func) => `${func}: ${this.functions[func].toString()}`)}
		}`;
	}
}
