/* eslint-disable */
// @ts-nocheck

import {
	FunctionDictionary,
	GenericAutomata,
	TAutomataBaseActionType,
	TAutomataBaseStateType,
	TValidator
} from '@yantrix/automata';
import { builtInFunctions } from '@yantrix/codegen';

export const statesDictionary = {
	'~~~START~~~': 74979334,
	INIT: 2252048,
	INTRO: 69824076,
	MAIN_MENU: 1730055131,
	'~~~END~~~': 1644281759,
	GAME_LOBBY: 1929949911,
	GAME_STARTING: 1032785389,
	IN_GAME: 1608719668,
	SCORE_SCREEN: 1985829159,
};
export const actionsDictionary = {
	RESET: 77866287,
	RUN: 81515,
	TO_MENU: 407301981,
	EXIT: 2142494,
	MENU_HOVER: 1305378364,
	CREATE_GAME: 1688544597,
	JOIN_GAME: 1973300761,
	START_GAME: 1058895409,
	BEGIN_GAME: 1626434024,
	END_GAME: 1757631242,
};
const reducer = {
	74979334: (prevContext, payload) => {
		return null;
	},
	2252048: (prevContext, payload) => {
		return null;
	},
	69824076: (prevContext, payload) => {
		return null;
	},
	1730055131: (prevContext, payload) => {
		return null;
	},
	1644281759: (prevContext, payload) => {
		return null;
	},
	1929949911: (prevContext, payload) => {
		return null;
	},
	1032785389: (prevContext, payload) => {
		return null;
	},
	1608719668: (prevContext, payload) => {
		return null;
	},
	1985829159: (prevContext, payload) => {
		return null;
	},
};
export const functionDictionary = new FunctionDictionary(builtInFunctions);
const actionsMap = {
	RESET: 'RESET',
	RUN: 'RUN',
	TO_MENU: 'TO_MENU',
	EXIT: 'EXIT',
	MENU_HOVER: 'MENU_HOVER',
	CREATE_GAME: 'CREATE_GAME',
	JOIN_GAME: 'JOIN_GAME',
	START_GAME: 'START_GAME',
	BEGIN_GAME: 'BEGIN_GAME',
	END_GAME: 'END_GAME',
} as const;
const statesMap = {
	'~~~START~~~': '~~~START~~~',
	INIT: 'INIT',
	INTRO: 'INTRO',
	MAIN_MENU: 'MAIN_MENU',
	'~~~END~~~': '~~~END~~~',
	GAME_LOBBY: 'GAME_LOBBY',
	GAME_STARTING: 'GAME_STARTING',
	IN_GAME: 'IN_GAME',
	SCORE_SCREEN: 'SCORE_SCREEN',
} as const;
export type TGamePhaseTest = {
	id: string;
	actions: typeof actionsMap;
	states: typeof statesMap;
	getState: (state: keyof typeof statesMap) => any;
	hasState: (instance: GamePhaseTest, state: keyof typeof statesMap) => boolean;
	getAction: (action: keyof typeof actionsMap) => any;
	createAction: (action: keyof typeof actionsMap, payload: any) => { action: any; payload: any };
};
const getDefaultContext = (prevContext, payload) => {
	const ctx = null;
	return Object.assign({}, prevContext, ctx);
};

const actionToStateFromStateDict = {
	74979334: {
		77866287: {
			state: 2252048,
		},
	},
	2252048: {
		81515: {
			state: 69824076,
		},
	},
	69824076: {
		407301981: {
			state: 1730055131,
		},
	},
	1730055131: {
		2142494: {
			state: 1644281759,
		},

		1305378364: {
			state: 1730055131,
		},

		1688544597: {
			state: 1929949911,
		},

		1973300761: {
			state: 1929949911,
		},
	},
	1929949911: {
		2142494: {
			state: 1644281759,
		},

		407301981: {
			state: 1730055131,
		},

		1058895409: {
			state: 1032785389,
		},
	},
	1032785389: {
		1626434024: {
			state: 1608719668,
		},
	},
	1608719668: {
		2142494: {
			state: 1644281759,
		},

		1757631242: {
			state: 1985829159,
		},

		407301981: {
			state: 1730055131,
		},
	},
	1985829159: {
		407301981: {
			state: 1730055131,
		},

		2142494: {
			state: 1644281759,
		},
	},
};
export class GamePhaseTest extends GenericAutomata {
	constructor() {
		super();
		this.init({
			state: 74979334,
			context: {},
			rootReducer: ({ action, context, payload, state }) => {
				if (!action || payload === null) return { state, context };
				if (!this.isKeyOf(state, actionToStateFromStateDict))
					throw new Error("Invalid state, maybe machine isn't running.");
				if (!this.isKeyOf(action, actionToStateFromStateDict[state])) return { state, context };
				const { state: newState } = actionToStateFromStateDict[state][action];

				const contextWithInitial = getDefaultContext(context, payload);
				const newContextFunc = reducer[newState];

				if (typeof newContextFunc !== 'function') {
					throw new Error('Invalid newContextFunc');
				}
				return { state: newState, context: newContextFunc(contextWithInitial, payload) };
			},
			stateValidator: ((s) => Object.values(statesDictionary).includes(s)) as TValidator<TAutomataBaseStateType>,
			actionValidator: ((a) =>
				Object.values(actionsDictionary).includes(a)) as TValidator<TAutomataBaseActionType>,
		});
	}
	isKeyOf = ((key, obj) => key in obj) as (key: any, obj: object) => key is keyof typeof obj;
	static id = 'GamePhaseTest';
	static actions = actionsMap;
	static states = statesMap;
	static getState = (state: keyof typeof statesMap) => statesDictionary[state];
	static hasState = (instance: GamePhaseTest, state: keyof typeof GamePhaseTest.states) =>
		instance.state === GamePhaseTest.getState(state);
	static getAction = (action: keyof typeof actionsMap) => actionsDictionary[action];
	static createAction = (action: keyof typeof actionsMap, payload: any) => {
		const actionId = GamePhaseTest.getAction(action);
		return {
			action: actionId,
			payload,
		};
	};
}
export default GamePhaseTest;
