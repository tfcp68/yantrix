/* eslint-disable */
// @ts-nocheck


			import { GenericAutomata, FunctionDictionary, TAutomataBaseActionType, TAutomataBaseStateType, TValidator } from '@yantrix/automata';
import { builtInFunctions } from '@yantrix/functions';

			export const statesDictionary = {
  "~~~START~~~": 74979334,
  "Off": 79183,
  "Red": 82033,
  "RedYellow": 1051543483,
  "Green": 69066467,
  "Yellow": 1650372460
}
export const actionsDictionary = {
  "Reset (initialCounter=0)": 1011118777,
  "Switch": 1805606060
}
const reducer = {74979334: (prevContext, payload, functionDictionary) => {
	
				return {counter: (function(){
						const boundValue = (function(){
						return functionDictionary.get('coalesce')((function(){
						if(payload !== null && payload['initialCounter'] !== undefined && payload['initialCounter'] !== null) {
							return payload['initialCounter']
						}
							else {
								return null
							}
					}()),functionDictionary.get('inc')((function(){
						if(prevContext !== null && prevContext['counter'] !== undefined && prevContext['counter'] !== null) {
							return prevContext['counter']
						}
							else {
								return null
							}
					}())))
					}())
						if(boundValue !== null){
							return boundValue
						}
						else {
							return 0
						}

					}())}
			},
	79183: (prevContext, payload, functionDictionary) => {
	
				return prevContext
			},
	82033: (prevContext, payload, functionDictionary) => {
	
				return prevContext
			},
	1051543483: (prevContext, payload, functionDictionary) => {
	
				return prevContext
			},
	69066467: (prevContext, payload, functionDictionary) => {
	
				return prevContext
			},
	1650372460: (prevContext, payload, functionDictionary) => {
	
				return prevContext
			}}
export const functionDictionary = new FunctionDictionary();
			const actionsMap = {
  "Reset (initialCounter=0)": "Reset (initialCounter=0)",
  "Switch": "Switch"
} as const
			const statesMap = {
  "~~~START~~~": "~~~START~~~",
  "Off": "Off",
  "Red": "Red",
  "RedYellow": "RedYellow",
  "Green": "Green",
  "Yellow": "Yellow"
} as const
			const getDefaultContext = (prevContext, payload) => {
				const ctx = {counter: (function(){
						const boundValue = (function(){
						return functionDictionary.get('coalesce')((function(){
						if(payload !== null && payload['initialCounter'] !== undefined && payload['initialCounter'] !== null) {
							return payload['initialCounter']
						}
							else {
								return null
							}
					}()),functionDictionary.get('inc')((function(){
						if(prevContext !== null && prevContext['counter'] !== undefined && prevContext['counter'] !== null) {
							return prevContext['counter']
						}
							else {
								return null
							}
					}())))
					}())
						if(boundValue !== null){
							return boundValue
						}
						else {
							return 0
						}

					}())}
				return  Object.assign({}, prevContext, ctx);
			}
			
			const actionToStateFromStateDict = {74979334: {
				  1011118777: {
				  	state: 79183,
				  },
				},
	79183: {
				  1805606060: {
				  	state: 82033,
				  },
				
	
				  1011118777: {
				  	state: 79183,
				  },
				},
	82033: {
				  1805606060: {
				  	state: 1051543483,
				  },
				
	
				  1011118777: {
				  	state: 79183,
				  },
				},
	1051543483: {
				  1805606060: {
				  	state: 69066467,
				  },
				
	
				  1011118777: {
				  	state: 79183,
				  },
				},
	69066467: {
				  1805606060: {
				  	state: 1650372460,
				  },
				
	
				  1011118777: {
				  	state: 79183,
				  },
				},
	1650372460: {
				  1805606060: {
				  	state: 82033,
				  },
				
	
				  1011118777: {
				  	state: 79183,
				  },
				},}
			
export class TrafficLightAutomata extends GenericAutomata {

    static id = 'TrafficLightAutomata';
    static actions = actionsMap;
    static states = statesMap;
    static getState = (state: keyof typeof statesMap) => statesDictionary[state];
    static hasState = (instance: TrafficLightAutomata, state: keyof typeof TrafficLightAutomata.states) => instance.state === TrafficLightAutomata.getState(state);
    static getAction = (action: keyof typeof actionsMap) => actionsDictionary[action];
    static createAction = (action: keyof typeof actionsMap, payload:any) => {
			const actionId = TrafficLightAutomata.getAction(action);
			return {
				action: actionId,
				payload,
			}
		};

    constructor() {
        super();
        this.init({
            state: 79183,
            context:{"counter":null},
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
            stateValidator: ((s) => Object.values(statesDictionary).includes(s)) as TValidator<TAutomataBaseStateType>,
            actionValidator: ((a) => Object.values(actionsDictionary).includes(a)) as TValidator<TAutomataBaseActionType>,
            functionRegistry: functionDictionary,
        });
    }

    isKeyOf = ((key, obj) => key in obj) as (key: any, obj: object) => key is keyof typeof obj;
}

export default TrafficLightAutomata;
		