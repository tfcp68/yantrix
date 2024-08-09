/**
 * Parent class for all Function Dictionaries of any Codegen Module.
 * Contains maps of functions (key = function name, value = language-specific function implementation)
 * ---
 * Because functions work differently in every language, every subclass must implement abstract getDictionaryCode() method
 */
export abstract class FunctionDictionary {
	protected functions: Record<string, string> = {};

	constructor(functions?: Record<string, string>) {
		this.functions = { ...functions };
	}

	protected getFunction(functionName: string): string {
		return this.functions[functionName];
	}
	protected setFunction(functionName: string, func: string): void {
		this.functions[functionName] = func;
	}
	protected getFunctionMap(): Record<string, string> {
		return this.functions;
	}

	/**
	 * Code for language-specific representation of the function dictionary object
	 */
	abstract getDictionaryCode(): string;
}
