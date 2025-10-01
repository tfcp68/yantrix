/* eslint-disable */
// @ts-nocheck


			import { GenericAutomata, FunctionDictionary, EventDictionary as GlobalEventDictionary, AutomataEventAdapter, BasicEventBus, builtInFunctions, internalFunctions, TAutomataBaseActionType, TAutomataBaseStateType, TValidator } from '@yantrix/core';

			export const statesDictionary = {
  "~~~START~~~": 74979334,
  "Configuring": 1705641475,
  "StartRun": 1381428969,
  "Ticking": 341679365,
  "TickSecond": 740690799,
  "TickMinute": 908437967,
  "TickHour": 2001144129,
  "Paused": 1911454386
}
export const actionsDictionary = {
  "Init": 2283824,
  "UpdateInput": 1073933409,
  "Reset": 78851375,
  "Apply": 63476558,
  "[-]": 88939,
  "TickSecond": 740690799,
  "TickMinute": 908437967,
  "TickHour": 2001144129,
  "Stop": 2587682,
  "Start": 80204866
}
export const functionDictionary = new FunctionDictionary();
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
  "Init": "Init",
  "UpdateInput": "UpdateInput",
  "Reset": "Reset",
  "Apply": "Apply",
  "[-]": "[-]",
  "TickSecond": "TickSecond",
  "TickMinute": "TickMinute",
  "TickHour": "TickHour",
  "Stop": "Stop",
  "Start": "Start"
}
			const statesMap = {
  "~~~START~~~": "~~~START~~~",
  "Configuring": "Configuring",
  "StartRun": "StartRun",
  "Ticking": "Ticking",
  "TickSecond": "TickSecond",
  "TickMinute": "TickMinute",
  "TickHour": "TickHour",
  "Paused": "Paused"
}
			const byPassedStates = new Set([1381428969,740690799,908437967,2001144129])
			export type TActionsClockAutomata = keyof typeof actionsMap;
			const getDefaultContext = (prevContext, payload) => {
				const ctx = prevContext
				return  Object.assign({}, prevContext, ctx);
			}
			
			const reducer = {
		74979334: (prevContext, payload, functionDictionary, automata) => {

				return prevContext
			},
	1705641475: (prevContext, payload, functionDictionary, automata) => {

				return {secMs: (function(){
			const boundValue = (function(){
						return functionDictionary.get('coalesce')((function(){
						if(payload !== null && payload['secMs'] !== undefined && payload['secMs'] !== null) {
							return payload['secMs']
						}
							else {
								return null
							}
					}()),(function(){
						if(prevContext !== null && prevContext['secMs'] !== undefined && prevContext['secMs'] !== null) {
							return prevContext['secMs']
						}
							else {
								return null
							}
					}()),1000)
					}())

			return boundValue

		}()),
	minMs: (function(){
			const boundValue = (function(){
						return functionDictionary.get('coalesce')((function(){
						if(payload !== null && payload['minMs'] !== undefined && payload['minMs'] !== null) {
							return payload['minMs']
						}
							else {
								return null
							}
					}()),(function(){
						if(prevContext !== null && prevContext['minMs'] !== undefined && prevContext['minMs'] !== null) {
							return prevContext['minMs']
						}
							else {
								return null
							}
					}()),60000)
					}())

			return boundValue

		}()),
	hourMs: (function(){
			const boundValue = (function(){
						return functionDictionary.get('coalesce')((function(){
						if(payload !== null && payload['hourMs'] !== undefined && payload['hourMs'] !== null) {
							return payload['hourMs']
						}
							else {
								return null
							}
					}()),(function(){
						if(prevContext !== null && prevContext['hourMs'] !== undefined && prevContext['hourMs'] !== null) {
							return prevContext['hourMs']
						}
							else {
								return null
							}
					}()),3600000)
					}())

			return boundValue

		}()),
	hourAngle: (function(){
						if(prevContext !== null && prevContext['hourAngle'] !== undefined && prevContext['hourAngle'] !== null) {
							return prevContext['hourAngle']
						}
							else {
								return 0
							}
					}()),
	minuteAngle: (function(){
						if(prevContext !== null && prevContext['minuteAngle'] !== undefined && prevContext['minuteAngle'] !== null) {
							return prevContext['minuteAngle']
						}
							else {
								return 0
							}
					}()),
	secondAngle: (function(){
						if(prevContext !== null && prevContext['secondAngle'] !== undefined && prevContext['secondAngle'] !== null) {
							return prevContext['secondAngle']
						}
							else {
								return 0
							}
					}())}
			},
	1381428969: (prevContext, payload, functionDictionary, automata) => {

				return {secMs: (function(){
			const boundValue = (function(){
						if(prevContext !== null && prevContext['secMs'] !== undefined && prevContext['secMs'] !== null) {
							return prevContext['secMs']
						}
							else {
								return null
							}
					}())

			return boundValue

		}()),
	minMs: (function(){
			const boundValue = (function(){
						if(prevContext !== null && prevContext['minMs'] !== undefined && prevContext['minMs'] !== null) {
							return prevContext['minMs']
						}
							else {
								return null
							}
					}())

			return boundValue

		}()),
	hourMs: (function(){
			const boundValue = (function(){
						if(prevContext !== null && prevContext['hourMs'] !== undefined && prevContext['hourMs'] !== null) {
							return prevContext['hourMs']
						}
							else {
								return null
							}
					}())

			return boundValue

		}()),
	hourAngle: (function(){
						if(prevContext !== null && prevContext['hourAngle'] !== undefined && prevContext['hourAngle'] !== null) {
							return prevContext['hourAngle']
						}
							else {
								return 0
							}
					}()),
	minuteAngle: (function(){
						if(prevContext !== null && prevContext['minuteAngle'] !== undefined && prevContext['minuteAngle'] !== null) {
							return prevContext['minuteAngle']
						}
							else {
								return 0
							}
					}()),
	secondAngle: (function(){
						if(prevContext !== null && prevContext['secondAngle'] !== undefined && prevContext['secondAngle'] !== null) {
							return prevContext['secondAngle']
						}
							else {
								return 0
							}
					}())}
			},
	341679365: (prevContext, payload, functionDictionary, automata) => {

				return prevContext
			},
	740690799: (prevContext, payload, functionDictionary, automata) => {

				return {secMs: (function(){
			const boundValue = (function(){
						if(prevContext !== null && prevContext['secMs'] !== undefined && prevContext['secMs'] !== null) {
							return prevContext['secMs']
						}
							else {
								return null
							}
					}())

			return boundValue

		}()),
	minMs: (function(){
			const boundValue = (function(){
						if(prevContext !== null && prevContext['minMs'] !== undefined && prevContext['minMs'] !== null) {
							return prevContext['minMs']
						}
							else {
								return null
							}
					}())

			return boundValue

		}()),
	hourMs: (function(){
			const boundValue = (function(){
						if(prevContext !== null && prevContext['hourMs'] !== undefined && prevContext['hourMs'] !== null) {
							return prevContext['hourMs']
						}
							else {
								return null
							}
					}())

			return boundValue

		}()),
	hourAngle: (function(){
			const boundValue = (function(){
						return functionDictionary.get('coalesce')((function(){
						if(prevContext !== null && prevContext['hourAngle'] !== undefined && prevContext['hourAngle'] !== null) {
							return prevContext['hourAngle']
						}
							else {
								return null
							}
					}()),0)
					}())

			return boundValue

		}()),
	minuteAngle: (function(){
			const boundValue = (function(){
						return functionDictionary.get('coalesce')((function(){
						if(prevContext !== null && prevContext['minuteAngle'] !== undefined && prevContext['minuteAngle'] !== null) {
							return prevContext['minuteAngle']
						}
							else {
								return null
							}
					}()),0)
					}())

			return boundValue

		}()),
	secondAngle: (function(){
			const boundValue = (function(){
						return functionDictionary.get('mod')(functionDictionary.get('add')(functionDictionary.get('coalesce')((function(){
						if(prevContext !== null && prevContext['secondAngle'] !== undefined && prevContext['secondAngle'] !== null) {
							return prevContext['secondAngle']
						}
							else {
								return null
							}
					}()),0),6),360)
					}())

			return boundValue

		}())}
			},
	908437967: (prevContext, payload, functionDictionary, automata) => {

				return {secMs: (function(){
			const boundValue = (function(){
						if(prevContext !== null && prevContext['secMs'] !== undefined && prevContext['secMs'] !== null) {
							return prevContext['secMs']
						}
							else {
								return null
							}
					}())

			return boundValue

		}()),
	minMs: (function(){
			const boundValue = (function(){
						if(prevContext !== null && prevContext['minMs'] !== undefined && prevContext['minMs'] !== null) {
							return prevContext['minMs']
						}
							else {
								return null
							}
					}())

			return boundValue

		}()),
	hourMs: (function(){
			const boundValue = (function(){
						if(prevContext !== null && prevContext['hourMs'] !== undefined && prevContext['hourMs'] !== null) {
							return prevContext['hourMs']
						}
							else {
								return null
							}
					}())

			return boundValue

		}()),
	hourAngle: (function(){
			const boundValue = (function(){
						return functionDictionary.get('coalesce')((function(){
						if(prevContext !== null && prevContext['hourAngle'] !== undefined && prevContext['hourAngle'] !== null) {
							return prevContext['hourAngle']
						}
							else {
								return null
							}
					}()),0)
					}())

			return boundValue

		}()),
	secondAngle: (function(){
			const boundValue = (function(){
						return functionDictionary.get('coalesce')((function(){
						if(prevContext !== null && prevContext['secondAngle'] !== undefined && prevContext['secondAngle'] !== null) {
							return prevContext['secondAngle']
						}
							else {
								return null
							}
					}()),0)
					}())

			return boundValue

		}()),
	minuteAngle: (function(){
			const boundValue = (function(){
						return functionDictionary.get('mod')(functionDictionary.get('add')(functionDictionary.get('coalesce')((function(){
						if(prevContext !== null && prevContext['minuteAngle'] !== undefined && prevContext['minuteAngle'] !== null) {
							return prevContext['minuteAngle']
						}
							else {
								return null
							}
					}()),0),6),360)
					}())

			return boundValue

		}())}
			},
	2001144129: (prevContext, payload, functionDictionary, automata) => {

				return {secMs: (function(){
			const boundValue = (function(){
						if(prevContext !== null && prevContext['secMs'] !== undefined && prevContext['secMs'] !== null) {
							return prevContext['secMs']
						}
							else {
								return null
							}
					}())

			return boundValue

		}()),
	minMs: (function(){
			const boundValue = (function(){
						if(prevContext !== null && prevContext['minMs'] !== undefined && prevContext['minMs'] !== null) {
							return prevContext['minMs']
						}
							else {
								return null
							}
					}())

			return boundValue

		}()),
	hourMs: (function(){
			const boundValue = (function(){
						if(prevContext !== null && prevContext['hourMs'] !== undefined && prevContext['hourMs'] !== null) {
							return prevContext['hourMs']
						}
							else {
								return null
							}
					}())

			return boundValue

		}()),
	minuteAngle: (function(){
			const boundValue = (function(){
						return functionDictionary.get('coalesce')((function(){
						if(prevContext !== null && prevContext['minuteAngle'] !== undefined && prevContext['minuteAngle'] !== null) {
							return prevContext['minuteAngle']
						}
							else {
								return null
							}
					}()),0)
					}())

			return boundValue

		}()),
	secondAngle: (function(){
			const boundValue = (function(){
						return functionDictionary.get('coalesce')((function(){
						if(prevContext !== null && prevContext['secondAngle'] !== undefined && prevContext['secondAngle'] !== null) {
							return prevContext['secondAngle']
						}
							else {
								return null
							}
					}()),0)
					}())

			return boundValue

		}()),
	hourAngle: (function(){
			const boundValue = (function(){
						return functionDictionary.get('mod')(functionDictionary.get('add')(functionDictionary.get('coalesce')((function(){
						if(prevContext !== null && prevContext['hourAngle'] !== undefined && prevContext['hourAngle'] !== null) {
							return prevContext['hourAngle']
						}
							else {
								return null
							}
					}()),0),30),360)
					}())

			return boundValue

		}())}
			},
	1911454386: (prevContext, payload, functionDictionary, automata) => {

				return prevContext
			}
	}
			
			const actionToStateFromStateDict = {74979334: {
				2283824: {
					state: [1705641475]
				}
			
	},
	1705641475: {
				2283824: {
					state: [1705641475]
				}
			,

				63476558: {
					state: [1381428969]
				}
			
	},
	1381428969: {
				88939: {
					state: [341679365]
				}
			,

				2283824: {
					state: [1705641475]
				}
			
	},
	341679365: {
				2283824: {
					state: [1705641475]
				}
			,

				2587682: {
					state: [1911454386]
				}
			,

				740690799: {
					state: [740690799]
				}
			,

				908437967: {
					state: [908437967]
				}
			,

				2001144129: {
					state: [2001144129]
				}
			
	},
	740690799: {
				88939: {
					state: [341679365]
				}
			,

				2283824: {
					state: [1705641475]
				}
			
	},
	908437967: {
				88939: {
					state: [341679365]
				}
			,

				2283824: {
					state: [1705641475]
				}
			
	},
	2001144129: {
				88939: {
					state: [341679365]
				}
			,

				2283824: {
					state: [1705641475]
				}
			
	},
	1911454386: {
				2283824: {
					state: [1705641475]
				}
			,

				80204866: {
					state: [341679365]
				}
			
	},}
			
export class ClockAutomata extends GenericAutomata {

    static id = 'ClockAutomata_1759304624417';
    static actions = actionsMap;
    static states = statesMap;
    static getState = (state: keyof typeof statesMap) => statesDictionary[state];
    static hasState = (instance: ClockAutomata, state: keyof typeof ClockAutomata.states) => instance.state === ClockAutomata.getState(state);
    static getAction = (action: keyof typeof actionsMap) => actionsDictionary[action];
    static createAction = (action: keyof typeof actionsMap, payload:any) => {
		const actionId = ClockAutomata.getAction(action);
		return {
			action: actionId,
			payload,
		}
	};

    constructor() {
        super(eventAdapter);
        this.init({
            state: 1705641475,
            context:{"secMs":null,"minMs":null,"hourMs":null,"hourAngle":null,"minuteAngle":null,"secondAngle":null},
            rootReducer: ({ action, context, payload, state }) => {
					if (!action || payload === null) return { state, context };

					if (!this.isKeyOf(state, actionToStateFromStateDict)) throw new Error("Invalid state, maybe machine isn't running.")
					if (!this.isKeyOf(action, actionToStateFromStateDict[state])) return { state, context };

					const getNew = (action,state,context,payload) => {
						this.lastAction = action;

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

						return {state:newState, context: newContextFunc(contextWithInitial, payload, this.getFunctionRegistry(), this)};

					}

					let localCtx = getNew(action,state,context,payload)

					while(byPassedStates.has(localCtx.state)) {
						localCtx = getNew(actionsDictionary['[-]'], localCtx.state, localCtx.context, {})
					}

					this.incrementCycle(); // increment automata local cycle counter
					incrementEpoch(); // increment global epoch counter

					return localCtx

  				},
            stateValidator: ((s) => Object.values(statesDictionary).includes(s)) as TValidator<TAutomataBaseStateType>,
            actionValidator: ((a) => Object.values(actionsDictionary).includes(a)) as TValidator<TAutomataBaseActionType>,
            functionRegistry: functionDictionary
        });
    }

    isKeyOf = ((key, obj) => key in obj) as (key: any, obj: object) => key is keyof typeof obj;
}

export default ClockAutomata;
			const epoch = { val: 1 };
const incrementEpoch = () => { epoch.val++ };
const getEpoch = () => epoch.val;
			const internals = {
	...internalFunctions,
	"currentStateId": internalFunctions.currentStateId(ClockAutomata),
	"currentStateName": internalFunctions.currentStateName(ClockAutomata, statesDictionary),
	"currentActionId": internalFunctions.currentActionId(ClockAutomata),
	"currentActionName": internalFunctions.currentActionName(ClockAutomata, actionsDictionary),
	"currentCycle": internalFunctions.currentCycle(ClockAutomata),
	"currentEpoch": getEpoch,
}
			functionDictionary.register(internals);
			functionDictionary.register(builtInFunctions);
		