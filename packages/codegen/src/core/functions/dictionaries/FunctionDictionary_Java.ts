import { FunctionDictionary } from '@yantrix/automata';
import Built_In_Functions from '../built-ins/Java';

// как же сильно жаба не дружит с функциями...

export class FunctionDictionaryJava extends FunctionDictionary {
	constructor(functions?: Record<string, string>) {
		super({ ...Built_In_Functions, ...functions });
	}

	getDictionaryCode() {
		return `public FunctionDictionary functionDictionary = new FunctionDictionary(
            Map.ofEntries(
                ${Object.keys(super.getFunctionMap())
					.map((func) => `Map.entry("${func}", ${super.getFunction(func)})`)
					.join(',\n')}
            )
        );`;
	}

	getDictionaryJavaClass() {
		return `
            public static class FunctionDictionary {

                private interface AutomataFunction {
                    Object invoke(Object... args);
                }
        
                private Map<String, AutomataFunction> functions;
        
                FunctionDictionary() {
                    // built-in
                    functions = Map.ofEntries(
                        ${Object.keys(super.getFunctionMap())
							.map((func) => `Map.entry("${func}", ${super.getFunction(func)})`)
							.join(',\n')}
                    );
                }
        
                FunctionDictionary(Map<String, AutomataFunction> functions) {
                    this();
                    this.functions.putAll(functions);
                }
        
                AutomataFunction getFunction(String functionKey) { return functions.get(functionKey); }
        
                void setFunction(String functionKey, AutomataFunction function) { functions.put(functionKey, function); }

            }
        `;
	}
}
