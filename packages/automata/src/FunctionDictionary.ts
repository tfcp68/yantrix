import { TAutomataFunction } from './types';
import { IAutomataFunctionRegistry } from './types/interfaces';

/**
 * Implementation of {@link IAutomataFunctionRegistry}, where functions are stored in a map.
 *
 * Has strict requirements for registering new functions, overwrites are not possible.
 */
export class FunctionDictionary implements IAutomataFunctionRegistry {
	private functions: Record<string, TAutomataFunction>;

	constructor(functions?: Record<string, TAutomataFunction>) {
		this.functions = functions ?? {};
	}

	register(f: string | Record<string, TAutomataFunction>, callback?: TAutomataFunction): Record<string, TAutomataFunction> {
		if (typeof f === 'string' && callback != null) {
			return this.registerSingleFunction(f, callback);
		} else if (typeof f === 'object') {
			return this.registerMultipleFunctions(f);
		} else {
			throw new TypeError('Incorrect arguments');
		}
	}

	private registerSingleFunction(functionKey: string, callback: TAutomataFunction): Record<string, TAutomataFunction> {
		if (functionKey.length < 1 || functionKey.length > 255) {
			throw new Error(`Function key length must be between 1-255 symbols!`);
		}
		if (!functionKey.match(/^[a-z]\w+$/i)) {
			throw new Error('Incorrect function key format!');
		}
		if (this.functions[functionKey] !== undefined) {
			throw new Error(`Function with the key ${functionKey} already exists, overwrite not permitted!`);
		}

		this.functions[functionKey] = callback;
		return { [functionKey]: callback };
	}

	private registerMultipleFunctions(
		functionMap: Record<string, TAutomataFunction>,
	): Record<string, TAutomataFunction> {
		Object.entries(functionMap).forEach(([name, callback]) => this.registerSingleFunction(name, callback));
		return functionMap;
	}

	has(functionKey: string) {
		const func = this.functions[functionKey];
		return func !== undefined;
	}

	get(functionKey: string): TAutomataFunction {
		const func = this.functions[functionKey];
		if (func)
			return func;
		else throw new Error(`Function with the key ${functionKey} not found!`);
	}

	call(functionKey: string, ...args: any[]) {
		const func = this.get(functionKey)!;
		return func(...args);
	}

	clear() {
		this.functions = {};
	}
}
