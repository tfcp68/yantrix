
			import { GenericAutomata, FunctionDictionary } from '@yantrix/automata';
import { builtInFunctions } from '@yantrix/functions';

			export const statesDictionary = {
  "~~~START~~~": 74979334,
  "A": 65
}
export const actionsDictionary = {
  "toA": 114982
}
const reducer = {74979334: (prevContext, payload, functionDictionary) => {
	
				return prevContext
			},
	65: (prevContext, payload, functionDictionary) => {
	
				return {UiWNmOldus: (function(){
						if(prevContext !== null && prevContext['UiWNmOldus'] !== undefined && prevContext['UiWNmOldus'] !== null) {
							return prevContext['UiWNmOldus']
						}
							else {
								return 'PoTVofXIwg'
							}
					}()),
	nwzkyvKpnv: (function(){
						if(prevContext !== null && prevContext['nwzkyvKpnv'] !== undefined && prevContext['nwzkyvKpnv'] !== null) {
							return prevContext['nwzkyvKpnv']
						}
							else {
								return '7917.5825176918115'
							}
					}()),
	SIBELVGEzV: (function(){
						if(prevContext !== null && prevContext['SIBELVGEzV'] !== undefined && prevContext['SIBELVGEzV'] !== null) {
							return prevContext['SIBELVGEzV']
						}
							else {
								return '56'
							}
					}()),
	PiauynzXDu: (function(){
						if(prevContext !== null && prevContext['PiauynzXDu'] !== undefined && prevContext['PiauynzXDu'] !== null) {
							return prevContext['PiauynzXDu']
						}
							else {
								return '[]'
							}
					}()),
	dquMVMUpst: (function(){
						if(prevContext !== null && prevContext['dquMVMUpst'] !== undefined && prevContext['dquMVMUpst'] !== null) {
							return prevContext['dquMVMUpst']
						}
							else {
								return payload === null || (payload === undefined  || payload['AphAPMvPmT'] === undefined) ? null : payload['AphAPMvPmT']
							}
					}()),
	jPLxrxwFsb: (function(){
						if(prevContext !== null && prevContext['jPLxrxwFsb'] !== undefined && prevContext['jPLxrxwFsb'] !== null) {
							return prevContext['jPLxrxwFsb']
						}
							else {
								return prevContext === null ||  (prevContext === undefined || prevContext['LksxdYkjDW'] === undefined) ? null : prevContext['LksxdYkjDW']
							}
					}()),
	egvFHdqbVE: (function(){
						if(prevContext !== null && prevContext['egvFHdqbVE'] !== undefined && prevContext['egvFHdqbVE'] !== null) {
							return prevContext['egvFHdqbVE']
						}
							else {
								return 3.14
							}
					}()),
	luisZhwJps: (function(){
						if(prevContext !== null && prevContext['luisZhwJps'] !== undefined && prevContext['luisZhwJps'] !== null) {
							return prevContext['luisZhwJps']
						}
							else {
								return payload === null || (payload === undefined  || payload['XhiBbTFsBQ'] === undefined) ? null : payload['XhiBbTFsBQ']
							}
					}())}
			}}
export const functionDictionary = new FunctionDictionary();
functionDictionary.register(builtInFunctions);
			const actionsMap = {
  "toA": "toA"
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
		