
			import { GenericAutomata, FunctionDictionary } from '@yantrix/automata';
import { builtInFunctions } from '@yantrix/functions';

			export const statesDictionary = {
  "~~~START~~~": 74979334,
  "A": 65
}
export const actionsDictionary = {
  "~~~START~~~, A, 0": 1349851831
}
const reducer = {74979334: (prevContext, payload, functionDictionary) => {
	
				return prevContext
			},
	65: (prevContext, payload, functionDictionary) => {
	
				return prevContext
			}}
export const functionDictionary = new FunctionDictionary();
functionDictionary.register(builtInFunctions);
			const actionsMap = {
  "~~~START~~~, A, 0": "~~~START~~~, A, 0"
}
			const statesMap = {
  "~~~START~~~": "~~~START~~~",
  "A": "A"
}
			const getDefaultContext = (prevContext, payload) => {
				const ctx = prevContext
				return  Object.assign({}, prevContext, ctx);
			}
			
			const actionToStateFromStateDict = {74979334: {
				  1349851831: {
				  	state: 65,
				  },
				},}
			
export class FunctionDictionaryTest extends GenericAutomata {

    static id = 'FunctionDictionaryTest';
    static actions = actionsMap;
    static states = statesMap;
    static getState = (state) => statesDictionary[state];
    static hasState = (instance, state) => instance.state === FunctionDictionaryTest.getState(state);
    static getAction = (action) => actionsDictionary[action];;
    static createAction = 
		(action, payload) => {
			const actionId = FunctionDictionaryTest.getAction(action);
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

export default FunctionDictionaryTest;
		