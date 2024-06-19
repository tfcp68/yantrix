import { GenericAutomata, TAutomataBaseActionType, TAutomataBaseStateType, TValidator } from '@yantrix/automata';

export const statesDictionary = {
	'/~~~START~~~': 1696941163,
	'/CLOSED': 753776219,
	'/OPEN': 45838073,
};
export const actionsDictionary = {
	'/RESET (list)': 1981133341,
	'/OPEN': 45838073,
};
const getDefaultContext = ({ payload, context: prevContext }) => {
	return {
		items: prevContext['items'] || [],
		selectedIndex: prevContext['selectedIndex'] || 0,
		AA: prevContext['BA'] || 0,

		BB: prevContext['BA'],
	};
};
const actionToStateFromStateDict = {
	1696941163: {
		1981133341: {
			state: 753776219,
			getNewContext: ({ payload, context }) => {
				const prevContext = getDefaultContext({ payload, context });
				return {
					BB: payload['payload'],
				};
			},
		},
	},
	753776219: {
		45838073: {
			state: 45838073,
			getNewContext: ({ payload, context }) => {
				const prevContext = getDefaultContext({ payload, context });
				return prevContext;
			},
		},
	},
};
export class DropdownAutomata extends GenericAutomata {
	constructor() {
		super();
		this.init({
			state: 1696941163,
			context: { items: [], selectedIndex: 0, AA: 0, BB: null },
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
