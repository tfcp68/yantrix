import { TAutomataFunction } from './types';
import { IAutomataFunctionRegistry } from './types/interfaces';

/**
 * Implementation of {@link IAutomataFunctionRegistry}, where functions are stored in a map.
 *
 * Has strict requirements for registering new functions, overwrites are not possible.
 *
 * One {@link FunctionDictionary} singleton can be created per slice.
 */
export class FunctionDictionary implements IAutomataFunctionRegistry {
	static _instance: FunctionDictionary | null;

	private functions: Record<string, TAutomataFunction>;

	private constructor() {
		this.functions = {};
	}

	static getInstance(): FunctionDictionary {
		if (this._instance == null) {
			this._instance = new FunctionDictionary();
		}
		return this._instance;
	}

	static clearInstance() {
		this._instance = null;
	}

	/**
	 * @throw Will throw an error if:
	 *
	 * 1). Name is not valid (valid name starts with a letter, has length 1-255 and does not contain any special symbols).
	 *
	 * 2). Name is already taken. Function cannot be registered under an already existing name to prevent overwriting of the basic built-in functions.
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
	 * Register multiple functions in the dictionary.
	 *
	 * @param functionMap - map of functions to register
	 * @returns map of all registered functions
	 */
	registerMultiple(
		functionMap: Record<string, TAutomataFunction>,
		overwrite: boolean,
	): Record<string, TAutomataFunction> {
		// временный костыль для тестов
		if (overwrite) {
			this.functions = Object.assign(this.functions, functionMap);
		} else {
			Object.entries(functionMap).forEach(([name, callback]) => this.register(name, callback));
		}
		return functionMap;
	}

	clear() {
		this.functions = {};
	}

	has(functionKey: string) {
		const func = this.functions[functionKey];
		return func !== undefined;
	}

	/**
	 * @throws Will throw an error if the function is not found by the specified key.
	 */
	get(functionKey: string): TAutomataFunction {
		const func = this.functions[functionKey];
		if (func) return func;
		else throw new Error(`Function with the key ${functionKey} not found!`);
	}

	/**
	 * @throws Will throw an error if:
	 *
	 * 1). Function is not found by the specified key.
	 *
	 * 2). Arguments for the function are incorrect(as specified in their implementation).
	 */
	call(functionKey: string, ...args: any[]) {
		const func = this.get(functionKey)!;
		return func(...args);
	}
}
