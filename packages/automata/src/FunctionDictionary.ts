import Default_Predicates from './functions/Predicates';

export class FunctionDictionary {
	private functions: Record<string, any> = {
		...Default_Predicates,
	};

	setFunction(functionKey: string, callback: (...args: any) => any) {
		this.functions[functionKey] = callback;
	}

	getFunction(functionKey: string) {
		return this.functions[functionKey];
	}
}
