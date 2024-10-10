
			import { GenericAutomata, FunctionDictionary } from '@yantrix/automata';
import { builtInFunctions } from '@yantrix/functions';

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
	
				return {kyCRIuUoDT: (function(){
						if(prevContext !== null && prevContext['kyCRIuUoDT'] !== undefined && prevContext['kyCRIuUoDT'] !== null) {
							return prevContext['kyCRIuUoDT']
						}
							else {
								return 'rnxUGHHnlc'
							}
					}()),
	KfwciijlTC: (function(){
						if(prevContext !== null && prevContext['KfwciijlTC'] !== undefined && prevContext['KfwciijlTC'] !== null) {
							return prevContext['KfwciijlTC']
						}
							else {
								return '9950.715505758446'
							}
					}()),
	BdxWBGIyZn: (function(){
						if(prevContext !== null && prevContext['BdxWBGIyZn'] !== undefined && prevContext['BdxWBGIyZn'] !== null) {
							return prevContext['BdxWBGIyZn']
						}
							else {
								return '22'
							}
					}()),
	BdCvyIZifL: (function(){
						if(prevContext !== null && prevContext['BdCvyIZifL'] !== undefined && prevContext['BdCvyIZifL'] !== null) {
							return prevContext['BdCvyIZifL']
						}
							else {
								return '[]'
							}
					}()),
	umMGHKjXke: (function(){
						if(prevContext !== null && prevContext['umMGHKjXke'] !== undefined && prevContext['umMGHKjXke'] !== null) {
							return prevContext['umMGHKjXke']
						}
							else {
								return payload === null || (payload === undefined  || payload['niqkAPMtcG'] === undefined) ? null : payload['niqkAPMtcG']
							}
					}()),
	cNTYRgWJeh: (function(){
						if(prevContext !== null && prevContext['cNTYRgWJeh'] !== undefined && prevContext['cNTYRgWJeh'] !== null) {
							return prevContext['cNTYRgWJeh']
						}
							else {
								return prevContext === null ||  (prevContext === undefined || prevContext['NJgcjnUOMT'] === undefined) ? null : prevContext['NJgcjnUOMT']
							}
					}()),
	TrEhIdeofv: (function(){
						if(prevContext !== null && prevContext['TrEhIdeofv'] !== undefined && prevContext['TrEhIdeofv'] !== null) {
							return prevContext['TrEhIdeofv']
						}
							else {
								return 3.14
							}
					}()),
	bqITbBuJpr: (function(){
						if(prevContext !== null && prevContext['bqITbBuJpr'] !== undefined && prevContext['bqITbBuJpr'] !== null) {
							return prevContext['bqITbBuJpr']
						}
							else {
								return payload === null || (payload === undefined  || payload['XbVuJwsbVI'] === undefined) ? null : payload['XbVuJwsbVI']
							}
					}())}
			},
	66: (prevContext, payload, functionDictionary) => {
	
				return {kyCRIuUoDT: (function(){
						if(prevContext !== null && prevContext['kyCRIuUoDT'] !== undefined && prevContext['kyCRIuUoDT'] !== null) {
							return prevContext['kyCRIuUoDT']
						}
							else {
								return null
							}
					}()),
	KfwciijlTC: (function(){
						if(prevContext !== null && prevContext['KfwciijlTC'] !== undefined && prevContext['KfwciijlTC'] !== null) {
							return prevContext['KfwciijlTC']
						}
							else {
								return null
							}
					}()),
	BdxWBGIyZn: (function(){
						if(prevContext !== null && prevContext['BdxWBGIyZn'] !== undefined && prevContext['BdxWBGIyZn'] !== null) {
							return prevContext['BdxWBGIyZn']
						}
							else {
								return null
							}
					}()),
	BdCvyIZifL: (function(){
						if(prevContext !== null && prevContext['BdCvyIZifL'] !== undefined && prevContext['BdCvyIZifL'] !== null) {
							return prevContext['BdCvyIZifL']
						}
							else {
								return null
							}
					}()),
	umMGHKjXke: (function(){
						if(prevContext !== null && prevContext['umMGHKjXke'] !== undefined && prevContext['umMGHKjXke'] !== null) {
							return prevContext['umMGHKjXke']
						}
							else {
								return null
							}
					}()),
	cNTYRgWJeh: (function(){
						if(prevContext !== null && prevContext['cNTYRgWJeh'] !== undefined && prevContext['cNTYRgWJeh'] !== null) {
							return prevContext['cNTYRgWJeh']
						}
							else {
								return null
							}
					}()),
	TrEhIdeofv: (function(){
						if(prevContext !== null && prevContext['TrEhIdeofv'] !== undefined && prevContext['TrEhIdeofv'] !== null) {
							return prevContext['TrEhIdeofv']
						}
							else {
								return null
							}
					}()),
	bqITbBuJpr: (function(){
						if(prevContext !== null && prevContext['bqITbBuJpr'] !== undefined && prevContext['bqITbBuJpr'] !== null) {
							return prevContext['bqITbBuJpr']
						}
							else {
								return null
							}
					}())}
			}}
export const functionDictionary = new FunctionDictionary();
functionDictionary.register(builtInFunctions);
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
		