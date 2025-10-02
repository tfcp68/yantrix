/* eslint-disable */
// @ts-nocheck


			import { GenericAutomata, FunctionDictionary, EventDictionary as GlobalEventDictionary, AutomataEventAdapter, BasicEventBus, TAutomataBaseActionType, TAutomataBaseStateType, TValidator } from '../../../src';
			import {builtInFunctions, internalFunctions} from "@yantrix/functions"

			export const statesDictionary = {
  "~~~START~~~": 74979334,
  "Idle": 2274292,
  "Filling": 809871199,
  "Pending": 982065527,
  "Success": 202516509,
  "Error": 67232232,
  "~~~END~~~": 1644281759
}
export const actionsDictionary = {
  "Init": 2283824,
  "FocusInput": 931411442,
  "UpdateSelect": 789957819,
  "UpdateInput": 1073933409,
  "Submit": 1807668168,
  "Resolve": 1532945972,
  "Reject": 1850843201,
  "Reset": 78851375
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
  "FocusInput": "FocusInput",
  "UpdateSelect": "UpdateSelect",
  "UpdateInput": "UpdateInput",
  "Submit": "Submit",
  "Resolve": "Resolve",
  "Reject": "Reject",
  "Reset": "Reset"
}
			const statesMap = {
  "~~~START~~~": "~~~START~~~",
  "Idle": "Idle",
  "Filling": "Filling",
  "Pending": "Pending",
  "Success": "Success",
  "Error": "Error",
  "~~~END~~~": "~~~END~~~"
}
			const byPassedStates = new Set([])
			export type TActionsWeatherReportAutomata = keyof typeof actionsMap;
			const getDefaultContext = (prevContext, payload) => {
				const ctx = prevContext
				return  Object.assign({}, prevContext, ctx);
			}

			const reducer = {
		74979334: (prevContext, payload, functionDictionary, automata) => {

				return prevContext
			},
	2274292: (prevContext, payload, functionDictionary, automata) => {

				return {coords: (function(){
						if(prevContext !== null && prevContext['coords'] !== undefined && prevContext['coords'] !== null) {
							return prevContext['coords']
						}
							else {
								return 0
							}
					}()),
	city: (function(){
						if(prevContext !== null && prevContext['city'] !== undefined && prevContext['city'] !== null) {
							return prevContext['city']
						}
							else {
								return 0
							}
					}())}
			},
	809871199: (prevContext, payload, functionDictionary, automata) => {

				return {coords: (function(){
			const boundValue = (function(){
						return functionDictionary.get('coalesce')((function(){
						if(payload !== null && payload['coords'] !== undefined && payload['coords'] !== null) {
							return payload['coords']
						}
							else {
								return null
							}
					}()),(function(){
						if(prevContext !== null && prevContext['coords'] !== undefined && prevContext['coords'] !== null) {
							return prevContext['coords']
						}
							else {
								return null
							}
					}()))
					}())

			return boundValue

		}()),
	city: (function(){
			const boundValue = (function(){
						return functionDictionary.get('coalesce')((function(){
						if(payload !== null && payload['city'] !== undefined && payload['city'] !== null) {
							return payload['city']
						}
							else {
								return null
							}
					}()),(function(){
						if(prevContext !== null && prevContext['city'] !== undefined && prevContext['city'] !== null) {
							return prevContext['city']
						}
							else {
								return null
							}
					}()))
					}())

			return boundValue

		}()),
	result: (function(){
						if(prevContext !== null && prevContext['result'] !== undefined && prevContext['result'] !== null) {
							return prevContext['result']
						}
							else {
								return 0
							}
					}()),
	error: (function(){
						if(prevContext !== null && prevContext['error'] !== undefined && prevContext['error'] !== null) {
							return prevContext['error']
						}
							else {
								return 0
							}
					}())}
			},
	982065527: (prevContext, payload, functionDictionary, automata) => {

				return {coords: (function(){
			const boundValue = (function(){
						return functionDictionary.get('coalesce')((function(){
						if(payload !== null && payload['coords'] !== undefined && payload['coords'] !== null) {
							return payload['coords']
						}
							else {
								return null
							}
					}()),(function(){
						if(prevContext !== null && prevContext['coords'] !== undefined && prevContext['coords'] !== null) {
							return prevContext['coords']
						}
							else {
								return null
							}
					}()))
					}())

			return boundValue

		}()),
	city: (function(){
			const boundValue = (function(){
						return functionDictionary.get('coalesce')((function(){
						if(payload !== null && payload['city'] !== undefined && payload['city'] !== null) {
							return payload['city']
						}
							else {
								return null
							}
					}()),(function(){
						if(prevContext !== null && prevContext['city'] !== undefined && prevContext['city'] !== null) {
							return prevContext['city']
						}
							else {
								return null
							}
					}()))
					}())

			return boundValue

		}())}
			},
	202516509: (prevContext, payload, functionDictionary, automata) => {

				return {result: (function(){
						if(prevContext !== null && prevContext['result'] !== undefined && prevContext['result'] !== null) {
							return prevContext['result']
						}
							else {
								return payload === null || (payload === undefined  || payload['data'] === undefined) ? null : payload['data']
							}
					}()),
	coords: (function(){
						if(prevContext !== null && prevContext['coords'] !== undefined && prevContext['coords'] !== null) {
							return prevContext['coords']
						}
							else {
								return null
							}
					}()),
	city: (function(){
						if(prevContext !== null && prevContext['city'] !== undefined && prevContext['city'] !== null) {
							return prevContext['city']
						}
							else {
								return null
							}
					}())}
			},
	67232232: (prevContext, payload, functionDictionary, automata) => {

				return {error: (function(){
						if(prevContext !== null && prevContext['error'] !== undefined && prevContext['error'] !== null) {
							return prevContext['error']
						}
							else {
								return payload === null || (payload === undefined  || payload['error'] === undefined) ? null : payload['error']
							}
					}()),
	coords: (function(){
						if(prevContext !== null && prevContext['coords'] !== undefined && prevContext['coords'] !== null) {
							return prevContext['coords']
						}
							else {
								return null
							}
					}()),
	city: (function(){
						if(prevContext !== null && prevContext['city'] !== undefined && prevContext['city'] !== null) {
							return prevContext['city']
						}
							else {
								return null
							}
					}())}
			},
	1644281759: (prevContext, payload, functionDictionary, automata) => {

				return prevContext
			}
	}

			const actionToStateFromStateDict = {74979334: {
				2283824: {
					state: [2274292]
				}

	},
	2274292: {
				2283824: {
					state: [2274292]
				}
			,

				789957819: {
					state: [809871199]
				}
			,

				931411442: {
					state: [809871199]
				}

	},
	809871199: {
				2283824: {
					state: [2274292]
				}
			,

				789957819: {
					state: [809871199]
				}
			,

				1073933409: {
					state: [809871199]
				}
			,

				1807668168: {
					state: [982065527]
				}

	},
	982065527: {
				2283824: {
					state: [2274292]
				}
			,

				1532945972: {
					state: [202516509]
				}
			,

				1850843201: {
					state: [67232232]
				}

	},
	67232232: {
				2283824: {
					state: [2274292]
				}
			,

				789957819: {
					state: [809871199]
				}
			,

				1073933409: {
					state: [809871199]
				}

	},
	202516509: {
				2283824: {
					state: [2274292]
				}
			,

				78851375: {
					state: [1644281759]
				}
			,

				789957819: {
					state: [809871199]
				}
			,

				1073933409: {
					state: [809871199]
				}

	},}

export class WeatherReportAutomata extends GenericAutomata {

    static id = 'WeatherReportAutomata_1758564684741';
    static actions = actionsMap;
    static states = statesMap;
    static getState = (state: keyof typeof statesMap) => statesDictionary[state];
    static hasState = (instance: WeatherReportAutomata, state: keyof typeof WeatherReportAutomata.states) => instance.state === WeatherReportAutomata.getState(state);
    static getAction = (action: keyof typeof actionsMap) => actionsDictionary[action];
    static createAction = (action: keyof typeof actionsMap, payload:any) => {
		const actionId = WeatherReportAutomata.getAction(action);
		return {
			action: actionId,
			payload,
		}
	};

    constructor() {
        super(eventAdapter);
        this.init({
            state: 2274292,
            context:{"coords":null,"city":null},
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

export default WeatherReportAutomata;
			const epoch = { val: 1 };
const incrementEpoch = () => { epoch.val++ };
const getEpoch = () => epoch.val;
			const internals = {
	...internalFunctions,
	"currentStateId": internalFunctions.currentStateId(WeatherReportAutomata),
	"currentStateName": internalFunctions.currentStateName(WeatherReportAutomata, statesDictionary),
	"currentActionId": internalFunctions.currentActionId(WeatherReportAutomata),
	"currentActionName": internalFunctions.currentActionName(WeatherReportAutomata, actionsDictionary),
	"currentCycle": internalFunctions.currentCycle(WeatherReportAutomata),
	"currentEpoch": getEpoch,
}
			functionDictionary.register(internals);
			functionDictionary.register(builtInFunctions);
