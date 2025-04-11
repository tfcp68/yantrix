import { BasicActionDictionary, BasicEventDictionary, BasicStateDictionary } from '@yantrix/automata';
import { StartState } from '@yantrix/mermaid-parser';
import { ByPassAction } from '../../../../../constants';
import { TExpressionRecord, TStateDiagramMatrixIncludeNotes } from '../../../../../types/common';
import { replaceFileContents } from '../../../../../utils/utils';
import { context } from '../context';
import { state } from '../state';

export function getClassTemplate(props: {
	className: string;
	diagram: TStateDiagramMatrixIncludeNotes;
	stateDictionary: BasicStateDictionary;
	eventDictionary: BasicEventDictionary;
	actionDictionary: BasicActionDictionary;
	expressions: TExpressionRecord;
	classSerializer: typeof classSerializer;
}) {
	const { diagram } = props;

	const initialState = state.functions.getInitialState({
		diagram,
	});

	const stateValue = props.stateDictionary.getStateValues({ keys: [initialState] })[0];

	if (stateValue === null) {
		throw new Error('GetClassTemplate: Invalid state');
	}

	const a = context.functions.getInitialContextShape({
		diagram,
		stateName: StartState,
	});
	const b = context.functions.getInitialContextShape({
		diagram,
		stateName: initialState,
	});

	const initialContext = Object.assign({}, a, b);

	return replaceFileContents(

		{
			'%CLASSNAME%': props.className,
			'%ID%': `'${props.className}_${Date.now()}'`,
			'%ACTIONS_MAP%': 'actionsMap',
			'%STATES_MAP%': 'statesMap',
			'%GET_STATE%': props.classSerializer.getGetStateFunc().toString(),
			'%HAS_STATE%': props.classSerializer.getHasStateFunc({ className: props.className }).toString(),
			'%GET_ACTION%': props.classSerializer.getGetActionFunc().toString(),
			'%CREATE_ACTION%': props.classSerializer.getCreateActionFunc({ className: props.className }).toString(),
			'%STATE%': (stateValue ?? -1).toString(),
			'%CONTEXT%': JSON.stringify(initialContext),
			'%REDUCER%': props.classSerializer.getRootReducer().toString(),
			'%STATE_VALIDATOR%': props.classSerializer.getStateValidator().toString(),
			'%ACTION_VALIDATOR%': props.classSerializer.getActionValidator().toString(),
			'%FUNCTION_REGISTRY%': 'functionDictionary',
			'%EVENT_DICTIONARY%': 'GlobalEventDictionary',
			'%IS_KEY_OF%': props.classSerializer.getIsKeyOf().toString(),
		},
	);
}

export function getHasStateFunc(props: { className: string }) {
	return `(instance, state) => instance.state === ${props.className}.getState(state)`;
}

export function getGetStateFunc() {
	return `(state) => statesDictionary[state]`;
}

export function getGetActionFunc() {
	return `(action) => actionsDictionary[action];`;
}

export function getCreateActionFunc(props: { className: string }) {
	return `
		(action, payload) => {
			const actionId = ${props.className}.getAction(action);
			return {
				action: actionId,
				payload,
			}
		}`;
}

export function getActionValidator() {
	return `(a) => Object.values(actionsDictionary).includes(a)`;
}

export function getRootReducer() {
	return `({ action, context, payload, state }) => {
					if (!action || payload === null) return { state, context };

					${getRootReducerStateValidation()}
					${getRootReducerActionValidation()}

					const getNew = (action,state,context,payload) => {
						this.lastAction = action;

						const actionMove = actionToStateFromStateDict[state][action];
						const newStateObject = { state: actionMove.state[0] }
						const contextWithInitial = getDefaultContext(context,payload)


						${getRootReducerNewStatePredicateResolution()}

						const newState = newStateObject.state;
						const newContextFunc = reducer[newState]

						if(typeof newContextFunc !== 'function') {
							throw new Error('Invalid newContextFunc')
						}

						return {state:newState, context: newContextFunc(contextWithInitial, payload, this.getFunctionRegistry(), this)};

					}

					let localCtx = getNew(action,state,context,payload)

					while(byPassedStates.has(localCtx.state)) {
						localCtx = getNew(actionsDictionary['${ByPassAction}'], localCtx.state, localCtx.context, {})
					}

					this.incrementCycle(); // increment automata local cycle counter
					epoch++; // increment global epoch counter

					return localCtx

  				}`;
}

export function getRootReducerNewStatePredicateResolution() {
	return `
			if(actionMove.state.length > 1 && actionMove.predicate != null) {
				// determine new state from predicate
				const resolvedPredicateValue = actionMove.predicate(contextWithInitial, payload, functionDictionary);
				if(resolvedPredicateValue == null) return { state, context };
				newStateObject.state = resolvedPredicateValue;
			}
		`;
}

export function getRootReducerStateValidation() {
	return `${getRootReducerStateValidationHead()} ${getRootReducerStateValidationError()}`;
}

export function getRootReducerStateValidationHead() {
	return `if (!this.isKeyOf(state, actionToStateFromStateDict))`;
}

export function getRootReducerStateValidationError() {
	return `throw new Error("Invalid state, maybe machine isn't running.")`;
}

export function getRootReducerActionValidation() {
	return `if (!this.isKeyOf(action, actionToStateFromStateDict[state])) return { state, context };`;
}

export function getStateValidator() {
	return `(s) => Object.values(statesDictionary).includes(s)`;
}

export function getIsKeyOf() {
	return `(key, obj) => key in obj`;
}

export const classSerializer = {
	getClassTemplate,
	getStateValidator,
	getHasStateFunc,
	getGetStateFunc,
	getGetActionFunc,
	getCreateActionFunc,
	getActionValidator,
	getRootReducer,
	getRootReducerStateValidation,
	getRootReducerStateValidationHead,
	getRootReducerStateValidationError,
	getRootReducerActionValidation,
	getIsKeyOf,
} as const;
