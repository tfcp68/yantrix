type AutomataFunction = (...args: any) => any; // ?

export class FunctionDictionary {
	private readonly functions: Record<string, AutomataFunction>;

	constructor(functions: Record<string, AutomataFunction>) {
		this.functions = functions;
	}

	/**
	 * Register function under a specific name in the dictionary
	 * @param functionKey - name of function
	 * @param callback - function to invoke
	 */
	register(functionKey: string, callback: AutomataFunction): void {
		// only set a function if its not present in dictionary to prevent overwrites of basic built-in functions
		if (!this.functions[functionKey]) {
			this.functions[functionKey] = callback;
		} else {
			// throw error?
		}
	}

	/**
	 * Fetch function from dictionary
	 * @param functionKey - name of the function
	 * @returns function to invoke
	 */
	getFunction(functionKey: string): AutomataFunction {
		// if not present - throw error ?
		return this.functions[functionKey];
	}

	/**
	 * Text representation for codegen
	 * @returns map of functions
	 */
	getDictionary(): string {
		return `{
			${Object.keys(this.functions).map((func) => `${func}: ${this.functions[func].toString()}`)}
		}`;
	}
}
