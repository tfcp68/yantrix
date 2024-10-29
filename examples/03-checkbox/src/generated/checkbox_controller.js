/* eslint-disable */
// @ts-nocheck


import { GenericAutomata, FunctionDictionary } from '@yantrix/automata';
import { builtInFunctions } from '@yantrix/functions';

export const statesDictionary = {
  "~~~START~~~": 74979334,
  "UNCHECKED": 945742542,
  "CHECKED": 1460296583
}
export const actionsDictionary = {
  "Initial state": 814687083,
  "TOGGLE": 1814974636
}

const reducer = {
	74979334: (prevContext, payload, functionDictionary) => {
		return prevContext
	},
	945742542: (prevContext, payload, functionDictionary) => {
		return prevContext
	},
	1460296583: (prevContext, payload, functionDictionary) => {
		return prevContext
	}
}

const predicates = {}

export const functionDictionary = new FunctionDictionary();

functionDictionary.register(builtInFunctions);

const actionsMap = {
  "Initial state": "Initial state",
  "TOGGLE": "TOGGLE"
}

const statesMap = {
  "~~~START~~~": "~~~START~~~",
  "UNCHECKED": "UNCHECKED",
  "CHECKED": "CHECKED"
}

const byPassedStates = new Set([])

const getDefaultContext = (prevContext, payload) => {
	const ctx = prevContext
	return  Object.assign({}, prevContext, ctx);
}

const actionToStateFromStateDict = {
	74979334: {
		814687083: {
			state: [945742542]
		}

	},
	945742542: {
		814687083: {
			state: [945742542]
		},
		1814974636: {
			state: [1460296583]
		}

	},
	1460296583: {
		814687083: {
			state: [945742542]
		}
	},
}

export class Checkbox extends GenericAutomata {
    static id = 'Checkbox';
    static actions = actionsMap;
    static states = statesMap;
    static getState = (state) => statesDictionary[state];
    static hasState = (instance, state) => instance.state === Checkbox.getState(state);
    static getAction = (action) => actionsDictionary[action];;
    static createAction =
		(action, payload) => {
			const actionId = Checkbox.getAction(action);
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

					const getNew = (action,state,context,payload) => {
						const actionMove = actionToStateFromStateDict[state][action];
						const newStateObject = { state: actionMove.state[0] }
						const contextWithInitial = getDefaultContext(context,payload)

					if(actionMove.state.length > 1 && actionMove.predicate != null) {
						const resolvedPredicateValue = actionMove.predicate(contextWithInitial, payload, functionDictionary);
						if(resolvedPredicateValue == null) return { state, context };
						newStateObject.state = resolvedPredicateValue;
					}
						const newState = newStateObject.state;
						const newContextFunc = reducer[newState]

						if(typeof newContextFunc !== 'function') {
							throw new Error('Invalid newContextFunc')
						}

						return {state:newState, context: newContextFunc(contextWithInitial, payload, this.getFunctionRegistry())};
					}

					let localCtx = getNew(action,state,context,payload)

					while(byPassedStates.has(localCtx.state)) {
						localCtx = getNew(actionsDictionary['[-]'], localCtx.state, localCtx.context, {})
					}

					return localCtx

  				},
            stateValidator: (s) => Object.values(statesDictionary).includes(s),
            actionValidator: (a) => Object.values(actionsDictionary).includes(a),
            functionRegistry: functionDictionary,
        });

    }

    isKeyOf = (key, obj) => key in obj;
}

export default Checkbox;
