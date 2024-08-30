export type TAutomataFunction = ((...args: any) => any) | null; // ?

export class FunctionDictionary {
	private readonly functions: Record<string, TAutomataFunction>;

	constructor(functions: Record<string, TAutomataFunction>) {
		this.functions = functions;
	}

	/**
	 * Register function under a specific name in the dictionary. Name must be valid (i.e starts with a letter, has length 1-255 and does not contain any special symbols)
	 *
	 * Function cannot be registered under an already existing name to prevent overwriting of the basic built-in functions.
	 *
	 * @param functionKey - name of function
	 * @param callback - function to invoke
	 */
	register(functionKey: string, callback: TAutomataFunction): TAutomataFunction {
		if (functionKey.length < 1 || functionKey.length > 255) {
			throw new Error(`Function key length must be between 1-255 symbols!`);
		}
		if (!functionKey.match(/^[a-zA-Z][a-zA-Z0-9_]+$/)) {
			throw new Error('Incorrect function key format!');
		}
		if (this.functions[functionKey] !== undefined) {
			throw new Error(`Function with the key ${functionKey} already exists, overwrite not permitted!`);
		}

		this.functions[functionKey] = callback;
		return callback;
	}
	/**
	 * Check if a function exists in the dictionary.
	 *
	 * @param functionKey - name of the function to check
	 * @returns true if the function exists, false otherwise
	 */
	has(functionKey: string) {
		const func = this.functions[functionKey];
		return func !== undefined;
	}
	/**
	 * Get function from dictionary;
	 *
	 * If the function is not found - throw an error.
	 *
	 * @param functionKey - name of the function
	 * @returns function to invoke
	 */
	get(functionKey: string): TAutomataFunction {
		const func = this.functions[functionKey];
		if (func) return func;
		else throw new Error(`Function with the key ${functionKey} not found!`);
	}
}
