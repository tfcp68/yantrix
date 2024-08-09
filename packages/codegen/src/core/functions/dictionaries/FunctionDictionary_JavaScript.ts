import { FunctionDictionary } from '@yantrix/automata';
import Built_In_Functions from '../built-ins/JavaScript';

export class FunctionDictionaryJavaScript extends FunctionDictionary {
	constructor(functions?: Record<string, string>) {
		super({ ...Built_In_Functions, ...functions });
	}

	getDictionaryCode() {
		return `{
                ${Object.keys(super.getFunctionMap())
					.map((funcName) => `${funcName}: ${super.getFunction(funcName)}`)
					.join(',\n')}
        }`;
	}
}
