
			import { GenericAutomata, FunctionDictionary } from '@yantrix/automata';
import { builtInFunctions } from '@yantrix/functions';

			export const statesDictionary = {
  "~~~START~~~": 74979334,
  "C": 67
}
export const actionsDictionary = {
  "toC": 114984
}
const reducer = {74979334: (prevContext, payload, functionDictionary) => {
	
				return prevContext
			},
	67: (prevContext, payload, functionDictionary) => {
	
				return prevContext
			}}
export const functionDictionary = new FunctionDictionary();
functionDictionary.register(builtInFunctions);
			const actionsMap = {
  "toC": "toC"
}
			const statesMap = {
  "~~~START~~~": "~~~START~~~",
  "C": "C"
}
			const getDefaultContext = (prevContext, payload) => {
				const ctx = prevContext
				return  Object.assign({}, prevContext, ctx);
			}
			
			const actionToStateFromStateDict = {74979334: {
				  114984: {
				  	state: 67,
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
		