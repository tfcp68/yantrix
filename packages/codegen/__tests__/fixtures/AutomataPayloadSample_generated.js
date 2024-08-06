import { GenericAutomata } from '@yantrix/automata';

export const statesDictionary = {
	'~~~START~~~': 74979334,
	A: 65,
};
export const actionsDictionary = {
	toA: 114982,
};
const getDefaultContext = ({ payload, context: prevContext }) => {
	// const initialContext = $//{this.getSubsyntaxContext(StartState)}
	return prevContext;
};
const actionToStateFromStateDict = {
	74979334: {
		114982: {
			state: 65,
			getNewContext: ({ payload, context: prevContext }) => {
				return {
					a: (function () {
						const boundValue = (function () {
							if (payload['b'] !== undefined && payload['b'] !== null) {
								return payload['b'];
							} else {
								return 300;
							}
						})();

						if (boundValue !== null) {
							return boundValue;
						}
						return null;
					})(),
				};
			},
		},
	},
};
export class AutomataPayloadSample extends GenericAutomata {
	constructor() {
		super();
		this.init({
			state: 74979334,
			context: null,
			rootReducer: ({ action, context, payload, state }) => {
				if (!action || payload === null) return { state, context };
				if (!this.isKeyOf(state, actionToStateFromStateDict))
					throw new Error("Invalid state, maybe machine isn't running.");
				if (!this.isKeyOf(action, actionToStateFromStateDict[state])) return { state, context };
				const { state: newState, getNewContext } = actionToStateFromStateDict[state][action];

				return { state: newState, context: getNewContext({ payload, context }) };
			},
			stateValidator: (s) => Object.values(statesDictionary).includes(s),
			actionValidator: (a) => Object.values(actionsDictionary).includes(a),
		});
	}
	isKeyOf = (key, obj) => key in obj;
}
