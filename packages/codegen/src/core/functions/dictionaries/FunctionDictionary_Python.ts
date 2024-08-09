import { FunctionDictionary } from '@yantrix/automata';
import Built_In_Functions from '../built-ins/Python';

export class FunctionDictionaryPython extends FunctionDictionary {
	constructor(functions?: Record<string, string>) {
		super({ ...Built_In_Functions, ...functions });
	}

	getDictionaryCode() {
		return `
            
        `;
	}
}
