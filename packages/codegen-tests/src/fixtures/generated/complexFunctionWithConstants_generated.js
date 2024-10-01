
			import { GenericAutomata, FunctionDictionary } from '@yantrix/automata';
import { builtInFunctions, add, mult, mult } from '@yantrix/functions';

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
	
				return prevContext
			},
	65: (prevContext, payload, functionDictionary) => {
	
				return {result: (function(){
						const boundValue = (function(){
						return functionDictionary.get('complexFunc')((function(){
						if(payload !== null && payload['value1'] !== undefined && payload['value1'] !== null) {
							return payload['value1']
						}
							else {
								return null
							}
					}()),(function(){
						if(payload !== null && payload['value2'] !== undefined && payload['value2'] !== null) {
							return payload['value2']
						}
							else {
								return null
							}
					}()))
					}())

						return boundValue

					}())}
			},
	66: (prevContext, payload, functionDictionary) => {
	
				return prevContext
			}}
export const functionDictionary = new FunctionDictionary();
functionDictionary.register(builtInFunctions);
functionDictionary.register('complexFunc', function(x, y) {
				return (function() {
				const func = functionDictionary.get('add');
				return func((function() {
				const func = functionDictionary.get('mult');
				return func(10, x);
			})(), (function() {
				const func = functionDictionary.get('mult');
				return func(2, y);
			})(), 5);
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
				const ctx = prevContext
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
            context:{},
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
		