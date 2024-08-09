import { FunctionDictionary } from '@yantrix/automata';
import { FunctionDictionaryJavaScript } from './FunctionDictionary_JavaScript';
import Built_In_Functions from '../built-ins/TypeScript';

export class FunctionDictionaryTypeScript extends FunctionDictionary {
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
