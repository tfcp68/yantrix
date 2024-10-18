import { JavaScriptCompiler } from '../../../JavaScript';

function getStateValidator(): string {
	return `(${JavaScriptCompiler.class.serializer.getStateValidator()}) as TValidator<TAutomataBaseStateType>`;
}

function getActionValidator(): string {
	return `(${JavaScriptCompiler.class.serializer.getActionValidator()}) as TValidator<TAutomataBaseActionType>`;
}

function getIsKeyOf(): string {
	return `(${JavaScriptCompiler.class.serializer.getIsKeyOf()}) as (key: any, obj: object) => key is keyof typeof obj`;
}

function getGetActionFunc(): string {
	return `(action: keyof typeof actionsMap) => actionsDictionary[action]`;
}

function getCreateActionFunc(className: string): string {
	return `(action: keyof typeof actionsMap, payload:any) => {
		const actionId = ${className}.getAction(action);
		return {
			action: actionId,
			payload,
		}
	}`;
}
function getHasStateFunc(className: string): string {
	return `(instance: ${className}, state: keyof typeof ${className}.states) => instance.state === ${className}.getState(state)`;
}

function getGetStateFunc(): string {
	return `(state: keyof typeof statesMap) => statesDictionary[state]`;
}

export const classSerializer = Object.assign({}, JavaScriptCompiler.class.serializer, {
	getStateValidator,
	getActionValidator,
	getIsKeyOf,
	getGetActionFunc,
	getCreateActionFunc,
	getHasStateFunc,
	getGetStateFunc,
});
