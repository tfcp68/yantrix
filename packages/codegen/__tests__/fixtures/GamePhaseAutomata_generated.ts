import { GenericAutomata, TAutomataBaseActionType, TAutomataBaseStateType, TValidator } from '@yantrix/automata';

export const statesDictionary = {
	'/~~~START~~~': 1696941163,
	'/INIT': 45657535,
	'/INTRO': 1415394173,
	'/MAIN_MENU': 1918712022,
	'/~~~END~~~': 2004485394,
	'/GAME_LOBBY': 487317864,
	'/GAME_STARTING': 1253633506,
	'/IN_GAME': 1301012547,
	'/SCORE_SCREEN': 1404098696,
};
export const actionsDictionary = {
	'/RESET': 1423436384,
	'/RUN': 1481692,
	'/TO_MENU': 99594860,
	'/EXIT': 45547981,
	'/MENU_HOVER': 1546956885,
	'/CREATE_GAME': 834502202,
	'/JOIN_GAME': 1675466392,
	'/START_GAME': 383736638,
	'/BEGIN_GAME': 1225901225,
	'/END_GAME': 808645083,
};
const getDefaultContext = ({ payload, context: prevContext }) => {
	return prevContext;
};
const actionToStateFromStateDict = {
	1696941163: {
		1423436384: {
			state: 45657535,
			getNewContext: ({ payload, context }) => {
				const prevContext = getDefaultContext({ payload, context });
				return prevContext;
			},
		},
	},
	45657535: {
		1481692: {
			state: 1415394173,
			getNewContext: ({ payload, context }) => {
				const prevContext = getDefaultContext({ payload, context });
				return prevContext;
			},
		},
	},
	1415394173: {
		99594860: {
			state: 1918712022,
			getNewContext: ({ payload, context }) => {
				const prevContext = getDefaultContext({ payload, context });
				return prevContext;
			},
		},
	},
	1918712022: {
		45547981: {
			state: 2004485394,
			getNewContext: ({ payload, context }) => {
				const prevContext = getDefaultContext({ payload, context });
				return prevContext;
			},
		},

		1546956885: {
			state: 1918712022,
			getNewContext: ({ payload, context }) => {
				const prevContext = getDefaultContext({ payload, context });
				return prevContext;
			},
		},

		834502202: {
			state: 487317864,
			getNewContext: ({ payload, context }) => {
				const prevContext = getDefaultContext({ payload, context });
				return prevContext;
			},
		},

		1675466392: {
			state: 487317864,
			getNewContext: ({ payload, context }) => {
				const prevContext = getDefaultContext({ payload, context });
				return prevContext;
			},
		},
	},
	487317864: {
		45547981: {
			state: 2004485394,
			getNewContext: ({ payload, context }) => {
				const prevContext = getDefaultContext({ payload, context });
				return prevContext;
			},
		},

		99594860: {
			state: 1918712022,
			getNewContext: ({ payload, context }) => {
				const prevContext = getDefaultContext({ payload, context });
				return prevContext;
			},
		},

		383736638: {
			state: 1253633506,
			getNewContext: ({ payload, context }) => {
				const prevContext = getDefaultContext({ payload, context });
				return prevContext;
			},
		},
	},
	1253633506: {
		1225901225: {
			state: 1301012547,
			getNewContext: ({ payload, context }) => {
				const prevContext = getDefaultContext({ payload, context });
				return prevContext;
			},
		},
	},
	1301012547: {
		45547981: {
			state: 2004485394,
			getNewContext: ({ payload, context }) => {
				const prevContext = getDefaultContext({ payload, context });
				return prevContext;
			},
		},

		808645083: {
			state: 1404098696,
			getNewContext: ({ payload, context }) => {
				const prevContext = getDefaultContext({ payload, context });
				return prevContext;
			},
		},

		99594860: {
			state: 1918712022,
			getNewContext: ({ payload, context }) => {
				const prevContext = getDefaultContext({ payload, context });
				return prevContext;
			},
		},
	},
	1404098696: {
		99594860: {
			state: 1918712022,
			getNewContext: ({ payload, context }) => {
				const prevContext = getDefaultContext({ payload, context });
				return prevContext;
			},
		},

		45547981: {
			state: 2004485394,
			getNewContext: ({ payload, context }) => {
				const prevContext = getDefaultContext({ payload, context });
				return prevContext;
			},
		},
	},
};
export class GamePhaseAutomata extends GenericAutomata {
	constructor() {
		super();
		this.init({
			state: 1696941163,
			context: {},
			rootReducer: ({ action, context, payload, state }) => {
				if (!action || payload === null) return { state, context };
				if (!this.isKeyOf(state, actionToStateFromStateDict))
					throw new Error("Invalid state, maybe machine isn't running.");
				if (!this.isKeyOf(action, actionToStateFromStateDict[state])) return { state, context };
				const { state: newState, getNewContext } = actionToStateFromStateDict[state][action];

				return { state: newState, context: getNewContext({ payload, context }) };
			},
			stateValidator: ((s) => Object.values(statesDictionary).includes(s)) as TValidator<TAutomataBaseStateType>,
			actionValidator: ((a) =>
				Object.values(actionsDictionary).includes(a)) as TValidator<TAutomataBaseActionType>,
		});
	}
	isKeyOf = ((key, obj) => key in obj) as (key: any, obj: object) => key is keyof typeof obj;
}
