import { JavaScriptCompiler } from '../../../JavaScript/JavaScriptCompiler';

function getStateValidator() {
	return `(${JavaScriptCompiler.class.serializer.getStateValidator()}) as TValidator<TAutomataBaseStateType>`;
}

function getActionValidator() {
	return `(${JavaScriptCompiler.class.serializer.getActionValidator()}) as TValidator<TAutomataBaseActionType>`;
}

function getIsKeyOf() {
	return `(${JavaScriptCompiler.class.serializer.getIsKeyOf()}) as (key: any, obj: object) => key is keyof typeof obj`;
}

function getGetActionFunc() {
	return `(action: keyof typeof actionsMap) => actionsDictionary[action]`;
}

function getCreateActionFunc(props: {
	className: string;
}) {
	return `(action: keyof typeof actionsMap, payload:any) => {
		const actionId = ${props.className}.getAction(action);
		return {
			action: actionId,
			payload,
		}
	}`;
}
function getHasStateFunc(props: {
	className: string;
}) {
	return `(instance: ${props.className}, state: keyof typeof ${props.className}.states) => instance.state === ${props.className}.getState(state)`;
}

function getGetStateFunc() {
	return `(state: keyof typeof statesMap) => statesDictionary[state]`;
}

export const classSerializer = {
	...JavaScriptCompiler.class.serializer,
	getStateValidator,
	getActionValidator,
	getIsKeyOf,
	getGetActionFunc,
	getCreateActionFunc,
	getHasStateFunc,
	getGetStateFunc,
} as const;
