/* eslint-disable */
// @ts-nocheck


import { GenericAutomata, FunctionDictionary } from '@yantrix/automata';
import { builtInFunctions } from '@yantrix/functions';

export const statesDictionary = {
  "UNCHECKED": 945742542,
  "CHECKED": 1460296583
}

export const actionsDictionary = {
  "TOGGLE": 1814974636
}

const reducer = {
    945742542: (prevContext, { id }) => {
        return {
            ...prevContext,
            [id]: false
        };
    },
    1460296583: (prevContext, { id }) => {
        return {
            ...prevContext,
            [id]: true
        };
    }
};

const predicates = {}

export const functionDictionary = new FunctionDictionary();

functionDictionary.register(builtInFunctions);

const actionsMap = {
  "TOGGLE": "TOGGLE"
}

const statesMap = {
  "UNCHECKED": "UNCHECKED",
  "CHECKED": "CHECKED"
}

const byPassedStates = new Set([])

const getDefaultContext = (prevContext, { id }) => ({
    ...prevContext,
    [id]: false
});

const actionToStateFromStateDict = {
	945742542: {
		1814974636: {
			state: [1460296583]
		}

	},
	1460296583: {
		1814974636: {
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
            state: 945742542,
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
