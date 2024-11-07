import { BasicStateDictionary } from '@yantrix/automata';
import { StartState } from '@yantrix/mermaid-parser';
import { ByPassAction } from '../../../../../constants';
import { TStateDiagramMatrixIncludeNotes } from '../../../../../types/common';
import { PythonTemplate } from '../../../../templates/Python';
// import { replaceFileContents } from '../../../../../utils/utils';
import { context } from '../context';
import { state } from '../state';

export function getClassTemplate(props: {
	className: string;
	diagram: TStateDiagramMatrixIncludeNotes;
	stateDictionary: BasicStateDictionary;
	classSerializer: typeof classSerializer;
}) {
	const initialState = state.functions.getInitialState({
		diagram: props.diagram,
	});

	const stateValue = props.stateDictionary.getStateValues({ keys: [initialState] })[0];

	if (stateValue === null) {
		throw new Error('GetClassTemplate: Invalid state');
	}

	const a = context.functions.getInitialContextShape({
		diagram: props.diagram,
		stateName: StartState,
	});
	const b = context.functions.getInitialContextShape({
		diagram: props.diagram,
		stateName: initialState,
	});

	const initialContext = Object.assign({}, a, b);

	return replaceFileContents(
		{
			'%CLASSNAME%': props.className,
			'%ID%': `'${props.className}'`,
			'%ACTIONS_MAP%': 'actionsMap',
			'%STATES_MAP%': 'statesMap',
			'%GET_STATE%': props.classSerializer.getGetStateFunc().toString(),
			'%HAS_STATE%': props.classSerializer.getHasStateFunc().toString(),
			'%GET_ACTION%': props.classSerializer.getGetActionFunc().toString(),
			'%CREATE_ACTION%': props.classSerializer.getCreateActionFunc().toString(),
			'%STATE%': (stateValue ?? -1).toString(),
			'%CONTEXT%': JSON.stringify(initialContext).replace(/null/g, 'None'),
			'%REDUCER%': props.classSerializer.getRootReducer().toString(),
			'%S_VALIDATOR%': props.classSerializer.getStateValidator().toString(),
			'%A_VALIDATOR%': props.classSerializer.getActionValidator().toString(),
			'%F_REGISTRY%': 'functionDictionary',
			'%IS_KEY_OF%': props.classSerializer.getIsKeyOf().toString(),
		},
	);
}

function replaceFileContents(replacementMap: Record<string, string>): string {
	let res = PythonTemplate;
	Object.entries(replacementMap).forEach(([template, str]) => {
		res = res.replaceAll(template, str);
	});
	return res;
}

export function getHasStateFunc() {
	const content = [`def hasState(self, instance, state):`, `\treturn instance.state == self.getState(state)`];
	return content.join('\n');
}

export function getGetStateFunc() {
	const content = [`def getState(self, state):`, `\treturn statesDictionary[state]`];
	return content.join('\n');
}

export function getGetActionFunc() {
	const content = [`def getAction(self, action):`, `\treturn actionsDictionary[action]`];
	return content.join('\n');
}

export function getCreateActionFunc() {
	const content = [`def createAction(self, action, payload):`, `\treturn {"action": self.getAction(action), "payload": payload}`];
	return content.join('\n');
}

export function getActionValidator() {
	const content = [`def actionValidator(self, a):`, `return a in actionsDictionary.values()`];
	return content.join('\n\t');
}
export function getRootReducer() {
	const content = [
		`def rootReducer(self, action, context, payload, state):`,
		`if (not action) or (payload is None):`,
		`\treturn {'state': state, 'context': context}`,
		`${getRootReducerStateValidation()}`,
		`${getRootReducerActionValidation()}`,
		`def getNew(action,state,context,payload):`,
		`\tactionMove = actionToStateFromStateDict[state][action]`,
		`\tnewStateObject = { "state": actionMove["state"][0] }`,
		`\tcontextWithInitial = getDefaultContext(context, payload)`,
		`\t${getRootReducerNewStatePredicateResolution()}`,
		`\tnewState = newStateObject["state"]`,
		`\tnewContextFunc = reducer[newState]`,
		`\tif not callable(newContextFunc):`,
		`\t\traise Exception('Invalid newContextFunc')`,
		`\treturn {"state": newState, "context": newContextFunc(contextWithInitial, payload, self.getFunctionRegistry())}`,
		`localCtx = getNew(action,state,context,payload)`,
		`while localCtx["state"] in byPassedStates:`,
		`\tlocalCtx = getNew(actionsDictionary['${ByPassAction}'], localCtx["state"], localCtx["context"], {})`,
		`return localCtx`,
	];
	return content.join('\n\t');
}

export function getRootReducerNewStatePredicateResolution() {
	const content = [
		`if len(actionMove["state"]) > 1 and actionMove["predicate"] is not None:`,
		`resolvedPredicateValue = actionMove["predicate"](contextWithInitial, payload, functionDictionary)`,
		`if resolvedPredicateValue is None:`,
		`\treturn { "state": state, "context": context}`,
		`newStateObject["state"] = resolvedPredicateValue`,
	];
	return content.join('\n\t\t\t');
}

export function getRootReducerStateValidation() {
	const context = [
		`${getRootReducerStateValidationHead()}`,
		`\t\t${getRootReducerStateValidationError()}`,
	];
	return context.join('\n');
}

export function getRootReducerStateValidationHead() {
	return `if not self.isKeyOf(state, actionToStateFromStateDict)`;
}

export function getRootReducerStateValidationError() {
	return `raise Exception("Invalid state, maybe machine isn't running.")`;
}

export function getRootReducerActionValidation() {
	const content = [
		`if not self.isKeyOf(action, actionToStateFromStateDict[state]):`,
		`return {'state': state, 'context': context }`,
	];
	return content.join('\n\t\t');
}

export function getStateValidator() {
	const content = [`def stateValidator(self, s):`, `return s in statesDictionary.values()`];
	return content.join('\n\t');
}

export function getIsKeyOf() {
	const content = [`def isKeyOf(self, key, obj):`, `return key in obj`];
	return content.join('\n\t');
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
