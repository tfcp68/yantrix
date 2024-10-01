
			import { GenericAutomata, FunctionDictionary } from '@yantrix/automata';
import { builtInFunctions, mult, add } from '@yantrix/functions';

			export const statesDictionary = {
  "~~~START~~~": 74979334,
  "A": 65,
  "B": 66
}
export const actionsDictionary = {
  "toA": 114982,
  "toB": 114983
}
const reducer = {74979334: (prevContext, payload, functionDictionary) => {
	
				return {initialValue: (function(){
						if(prevContext !== null && prevContext['initialValue'] !== undefined && prevContext['initialValue'] !== null) {
							return prevContext['initialValue']
						}
							else {
								return 10
							}
					}())}
			},
	65: (prevContext, payload, functionDictionary) => {
	
				return {result: (function(){
						const boundValue = (function(){
						return functionDictionary.get('addAndMultiply')((function(){
						if(prevContext !== null && prevContext['initialValue'] !== undefined && prevContext['initialValue'] !== null) {
							return prevContext['initialValue']
						}
							else {
								return null
							}
					}()),(function(){
						if(payload !== null && payload['valueFromPayload'] !== undefined && payload['valueFromPayload'] !== null) {
							return payload['valueFromPayload']
						}
							else {
								return null
							}
					}()),2)
					}())

						return boundValue

					}())}
			},
	66: (prevContext, payload, functionDictionary) => {
	
				return {finalResult: (function(){
						const boundValue = (function(){
						return functionDictionary.get('add')((function(){
						if(prevContext !== null && prevContext['result'] !== undefined && prevContext['result'] !== null) {
							return prevContext['result']
						}
							else {
								return null
							}
					}()),5)
					}())

						return boundValue

					}())}
			}}
export const functionDictionary = new FunctionDictionary();
functionDictionary.register(builtInFunctions);
functionDictionary.register('addAndMultiply', function(a,b, c) {
				return (function() {
				const func = functionDictionary.get('mult');
				return func((function() {
				const func = functionDictionary.get('add');
				return func(a, b);
			})(), c);
			})();
			});
			const actionsMap = {
  "toA": "toA",
  "toB": "toB"
}
			const statesMap = {
  "~~~START~~~": "~~~START~~~",
  "A": "A",
  "B": "B"
}
			const getDefaultContext = (prevContext, payload) => {
				const ctx = {initialValue: (function(){
						if(prevContext !== null && prevContext['initialValue'] !== undefined && prevContext['initialValue'] !== null) {
							return prevContext['initialValue']
						}
							else {
								return 10
							}
					}())}
				return  Object.assign({}, prevContext, ctx);
			}
			
			const actionToStateFromStateDict = {74979334: {
				  114982: {
				  	state: 65,
				  },
				},
	65: {
				  114983: {
				  	state: 66,
				  },
				
	
				  114982: {
				  	state: 65,
				  },
				},}
			
export class Test extends GenericAutomata {

    static id = 'Test';
    static actions = actionsMap;
    static states = statesMap;
    static getState = (state) => statesDictionary[state];
    static hasState = (instance, state) => instance.state === Test.getState(state);
    static getAction = (action) => actionsDictionary[action];;
    static createAction = 
		(action, payload) => {
			const actionId = Test.getAction(action);
			return {
				action: actionId,
				payload,
			}
		};

    constructor() {
        super();
        this.init({
            state: 74979334,
            context:{"initialValue":null},
            rootReducer: ({ action, context, payload, state }) => {
					if (!action || payload === null) return { state, context };
					if (!this.isKeyOf(state, actionToStateFromStateDict)) throw new Error("Invalid state, maybe machine isn't running.")
					if (!this.isKeyOf(action, actionToStateFromStateDict[state])) return { state, context };
					const {state:newState} = actionToStateFromStateDict[state][action]

					const contextWithInitial = getDefaultContext(context,payload)

					const newContextFunc = reducer[newState]

					if(typeof newContextFunc !== 'function') {
						throw new Error('Invalid newContextFunc')
					}
					return {state:newState, context: newContextFunc(contextWithInitial, payload, this.getFunctionRegistry())};
  				},
            stateValidator: (s) => Object.values(statesDictionary).includes(s),
            actionValidator: (a) => Object.values(actionsDictionary).includes(a),
            functionRegistry: functionDictionary,
        });
    }

    isKeyOf = (key, obj) => key in obj;
}

export default Test;
		