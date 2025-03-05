/* eslint-disable */
// @ts-nocheck


			import { GenericAutomata, FunctionDictionary, EventDictionary as GlobalEventDictionary, AutomataEventAdapter, BasicEventBus, builtInFunctions, TAutomataBaseActionType, TAutomataBaseStateType, TValidator } from '@yantrix/core';

			export const statesDictionary = {
  "~~~START~~~": 74979334,
  "Off": 79183,
  "Red": 82033,
  "RedYellow": 1051543483,
  "Green": 69066467,
  "Yellow": 1650372460
}
export const actionsDictionary = {
  "Reset": 78851375,
  "Switch": 1805606060
}
export const functionDictionary = new FunctionDictionary();
functionDictionary.register(builtInFunctions);
			const eventAdapter = new AutomataEventAdapter();












			export function createEventBus(id, FSMs) {
const EventBus = new BasicEventBus();
EventBus.correlationId = id;
const automatas = Object.fromEntries(
		Object.entries(FSMs).map(([automataId, AutomataClass]) => {
			return [automataId, new AutomataClass()]
		})
	);
Object.entries(GlobalEventDictionary.getDictionary())
	.forEach(([eventName, eventId]) => {
	
		EventBus.subscribe(eventId, ({ event, meta }) => {

			const nextEventsToProcess = [];

			Object.values(automatas).forEach(automata => {
				const newActions = automata.eventAdapter?.handleEvent({ event, meta }) ?? [];
				for (const action of newActions) {
					automata.dispatch(action);
					const newAutomataEvents = automata.eventAdapter?.handleTransition(automata.getContext()) ?? [];
					nextEventsToProcess.push(...newAutomataEvents);
				}
			})

			EventBus.dispatch(...nextEventsToProcess);
	
			return {
				event,
				meta,
				task_id: `event_${eventName}_${eventId}`,
				result: new Promise((resolve, reject) => {
					try {
						const eventStack = EventBus.getEventStack();
						resolve(eventStack);
					} catch {
						reject(new Error('Error getting event stack'))
					}
				})
			}
		})

	});
return [EventBus, automatas];
}
			const actionsMap = {
  "Reset": "Reset",
  "Switch": "Switch"
}
			const statesMap = {
  "~~~START~~~": "~~~START~~~",
  "Off": "Off",
  "Red": "Red",
  "RedYellow": "RedYellow",
  "Green": "Green",
  "Yellow": "Yellow"
}
			const byPassedStates = new Set([])
			export type TActionsTrafficLightAutomata = keyof typeof actionsMap;
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
			
			const reducer = {
		74979334: (prevContext, payload, functionDictionary) => {

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
			}
	}
			
			const actionToStateFromStateDict = {74979334: {
				78851375: {
					state: [79183]
				}
			
	},
	79183: {
				78851375: {
					state: [79183]
				}
			,

				1805606060: {
					state: [82033]
				}
			
	},
	82033: {
				78851375: {
					state: [79183]
				}
			,

				1805606060: {
					state: [1051543483]
				}
			
	},
	1051543483: {
				78851375: {
					state: [79183]
				}
			,

				1805606060: {
					state: [69066467]
				}
			
	},
	69066467: {
				78851375: {
					state: [79183]
				}
			,

				1805606060: {
					state: [1650372460]
				}
			
	},
	1650372460: {
				78851375: {
					state: [79183]
				}
			,

				1805606060: {
					state: [82033]
				}
			
	},}
			
export class TrafficLightAutomata extends GenericAutomata {

    static id = 'TrafficLightAutomata_1739524890085';
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
        super(eventAdapter);
        this.init({
            state: 79183,
            context:{"counter":null},
            rootReducer: ({ action, context, payload, state }) => {
					if (!action || payload === null) return { state, context };

					if (!this.isKeyOf(state, actionToStateFromStateDict)) throw new Error("Invalid state, maybe machine isn't running.")
					if (!this.isKeyOf(action, actionToStateFromStateDict[state])) return { state, context };


					const getNew = (action,state,context,payload) => {
						const actionMove = actionToStateFromStateDict[state][action];
						const newStateObject = { state: actionMove.state[0] }
						const contextWithInitial = getDefaultContext(context,payload)


						
			if(actionMove.state.length > 1 && actionMove.predicate != null) {
				// determine new state from predicate
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
            stateValidator: ((s) => Object.values(statesDictionary).includes(s)) as TValidator<TAutomataBaseStateType>,
            actionValidator: ((a) => Object.values(actionsDictionary).includes(a)) as TValidator<TAutomataBaseActionType>,
            functionRegistry: functionDictionary
        });
    }

    isKeyOf = ((key, obj) => key in obj) as (key: any, obj: object) => key is keyof typeof obj;
}

export default TrafficLightAutomata;
		