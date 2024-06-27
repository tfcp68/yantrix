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
const actionToStateFromStateDict = {
	45657535: { 1481692: 1415394173 },
	487317864: { 45547981: 2004485394, 99594860: 1918712022, 383736638: 1253633506 },
	1253633506: { 1225901225: 1301012547 },
	1301012547: { 45547981: 2004485394, 99594860: 1918712022, 808645083: 1404098696 },
	1404098696: { 45547981: 2004485394, 99594860: 1918712022 },
	1415394173: { 99594860: 1918712022 },
	1696941163: { 1423436384: 45657535 },
	1918712022: { 45547981: 2004485394, 834502202: 487317864, 1546956885: 1918712022, 1675466392: 487317864 },
};
export class GamePhaseAutomata extends GenericAutomata {
	constructor() {
		super();
		this.init({
			state: 1696941163,
			context: { index: -1 },
			rootReducer: ({ action, context, payload, state }) => {
				if (!action || payload === null) return { state, context };
				if (!this.isKeyOf(state, actionToStateFromStateDict))
					throw new Error("Invalid state, maybe machine isn't running.");
				if (!this.isKeyOf(action, actionToStateFromStateDict[state])) return { state, context };
				const newState = actionToStateFromStateDict[state][action] ?? state;
				return { state: newState, context: { ...payload } };
			},
			stateValidator: ((s) => Object.values(statesDictionary).includes(s)) as TValidator<TAutomataBaseStateType>,
			actionValidator: ((a) =>
				Object.values(actionsDictionary).includes(a)) as TValidator<TAutomataBaseActionType>,
		});
	}
	isKeyOf = ((key, obj) => key in obj) as (key: any, obj: object) => key is keyof typeof obj;
}
