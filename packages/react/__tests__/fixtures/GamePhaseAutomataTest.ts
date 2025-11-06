/* eslint-disable */
// @ts-nocheck


			import { GenericAutomata, FunctionDictionary, EventDictionary as GlobalEventDictionary, AutomataEventAdapter, BasicEventBus, builtInFunctions, internalFunctions, TAutomataBaseActionType, TAutomataBaseStateType, TValidator } from '@yantrix/core';

			export const statesDictionary = {
  "~~~START~~~": 74979334,
  "INIT": 2252048,
  "INTRO": 69824076,
  "MAIN_MENU": 1730055131,
  "~~~END~~~": 1644281759,
  "GAME_LOBBY": 1929949911,
  "GAME_STARTING": 1032785389,
  "IN_GAME": 1608719668,
  "SCORE_SCREEN": 1985829159
}
export const actionsDictionary = {
  "RESET": 77866287,
  "RUN": 81515,
  "TO_MENU": 407301981,
  "EXIT": 2142494,
  "MENU_HOVER": 1305378364,
  "CREATE_GAME": 1688544597,
  "JOIN_GAME": 1973300761,
  "START_GAME": 1058895409,
  "BEGIN_GAME": 1626434024,
  "END_GAME": 1757631242
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
  "RESET": "RESET",
  "RUN": "RUN",
  "TO_MENU": "TO_MENU",
  "EXIT": "EXIT",
  "MENU_HOVER": "MENU_HOVER",
  "CREATE_GAME": "CREATE_GAME",
  "JOIN_GAME": "JOIN_GAME",
  "START_GAME": "START_GAME",
  "BEGIN_GAME": "BEGIN_GAME",
  "END_GAME": "END_GAME"
}
			const statesMap = {
  "~~~START~~~": "~~~START~~~",
  "INIT": "INIT",
  "INTRO": "INTRO",
  "MAIN_MENU": "MAIN_MENU",
  "~~~END~~~": "~~~END~~~",
  "GAME_LOBBY": "GAME_LOBBY",
  "GAME_STARTING": "GAME_STARTING",
  "IN_GAME": "IN_GAME",
  "SCORE_SCREEN": "SCORE_SCREEN"
}
			const byPassedStates = new Set([])
			export type TActionsGamePhaseAutomata = keyof typeof actionsMap;
			const getDefaultContext = (prevContext, payload) => {
				const ctx = prevContext
				return  Object.assign({}, prevContext, ctx);
			}
			
			const reducer = {
		74979334: (prevContext, payload, functionDictionary, automata) => {

				return prevContext
			},
	2252048: (prevContext, payload, functionDictionary, automata) => {

				return prevContext
			},
	69824076: (prevContext, payload, functionDictionary, automata) => {

				return prevContext
			},
	1730055131: (prevContext, payload, functionDictionary, automata) => {

				return prevContext
			},
	1644281759: (prevContext, payload, functionDictionary, automata) => {

				return prevContext
			},
	1929949911: (prevContext, payload, functionDictionary, automata) => {

				return prevContext
			},
	1032785389: (prevContext, payload, functionDictionary, automata) => {

				return prevContext
			},
	1608719668: (prevContext, payload, functionDictionary, automata) => {

				return prevContext
			},
	1985829159: (prevContext, payload, functionDictionary, automata) => {

				return prevContext
			}
	}
			
			const actionToStateFromStateDict = {74979334: {
				77866287: {
					state: [2252048]
				}
			
	},
	2252048: {
				81515: {
					state: [69824076]
				}
			,

				77866287: {
					state: [2252048]
				}
			
	},
	69824076: {
				77866287: {
					state: [2252048]
				}
			,

				407301981: {
					state: [1730055131]
				}
			
	},
	1730055131: {
				2142494: {
					state: [1644281759]
				}
			,

				77866287: {
					state: [2252048]
				}
			,

				1305378364: {
					state: [1730055131]
				}
			,

				1688544597: {
					state: [1929949911]
				}
			,

				1973300761: {
					state: [1929949911]
				}
			
	},
	1929949911: {
				2142494: {
					state: [1644281759]
				}
			,

				77866287: {
					state: [2252048]
				}
			,

				407301981: {
					state: [1730055131]
				}
			,

				1058895409: {
					state: [1032785389]
				}
			
	},
	1032785389: {
				77866287: {
					state: [2252048]
				}
			,

				1626434024: {
					state: [1608719668]
				}
			
	},
	1608719668: {
				2142494: {
					state: [1644281759]
				}
			,

				77866287: {
					state: [2252048]
				}
			,

				407301981: {
					state: [1730055131]
				}
			,

				1757631242: {
					state: [1985829159]
				}
			
	},
	1985829159: {
				2142494: {
					state: [1644281759]
				}
			,

				77866287: {
					state: [2252048]
				}
			,

				407301981: {
					state: [1730055131]
				}
			
	},}
			
export class GamePhaseAutomata extends GenericAutomata {

    static id = 'GamePhaseAutomata_1762449360536';
    static actions = actionsMap;
    static states = statesMap;
    static getState = (state: keyof typeof statesMap) => statesDictionary[state];
    static hasState = (instance: GamePhaseAutomata, state: keyof typeof GamePhaseAutomata.states) => instance.state === GamePhaseAutomata.getState(state);
    static getAction = (action: keyof typeof actionsMap) => actionsDictionary[action];
    static createAction = (action: keyof typeof actionsMap, payload:any) => {
		const actionId = GamePhaseAutomata.getAction(action);
		return {
			action: actionId,
			payload,
		}
	};

    constructor() {
        super(eventAdapter);
        this.init({
            state: 74979334,
            context:{},
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
        const initReducer = reducer[this.state];
		const prev = this.getContext()?.context ?? {};
		const initContext = initReducer(prev, {}, this.getFunctionRegistry(), this);
		this.setContext({ state: this.state, context: Object.assign({}, prev, initContext) });
	
    }

    isKeyOf = ((key, obj) => key in obj) as (key: any, obj: object) => key is keyof typeof obj;
}

export default GamePhaseAutomata;
			const epoch = { val: 1 };
const incrementEpoch = () => { epoch.val++ };
const getEpoch = () => epoch.val;
			const internals = {
	...internalFunctions,
	"currentStateId": internalFunctions.currentStateId(GamePhaseAutomata),
	"currentStateName": internalFunctions.currentStateName(GamePhaseAutomata, statesDictionary),
	"currentActionId": internalFunctions.currentActionId(GamePhaseAutomata),
	"currentActionName": internalFunctions.currentActionName(GamePhaseAutomata, actionsDictionary),
	"currentCycle": internalFunctions.currentCycle(GamePhaseAutomata),
	"currentEpoch": getEpoch,
}
			functionDictionary.register(internals);
			functionDictionary.register(builtInFunctions);
		