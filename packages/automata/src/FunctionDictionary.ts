type AutomataFunction = (...args: any) => any; // ?

export class FunctionDictionary {
	private functions: Record<string, AutomataFunction>;

	constructor(functions: Record<string, AutomataFunction>) {
		this.functions = functions;
	}

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
