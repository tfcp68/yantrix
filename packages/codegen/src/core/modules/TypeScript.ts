import { ICodegen, TStateDiagramMatrixIncludeNotes } from '../../types/common.js';
import { JavaScriptCodegen } from './JavaScript.js';

export class TypeScriptCodegen extends JavaScriptCodegen implements ICodegen<'TypeScript'> {
	constructor(diagram: TStateDiagramMatrixIncludeNotes) {
		super(diagram);
		this.imports['@yantrix/automata'].push('TAutomataBaseActionType', 'TAutomataBaseStateType', 'TValidator');
	}

	protected getStateValidator() {
		return `(${super.getStateValidator()}) as TValidator<TAutomataBaseStateType>`;
	}

	protected getActionValidator() {
		return `(${super.getActionValidator()}) as TValidator<TAutomataBaseActionType>`;
	}

	protected getIsKeyOf() {
		return `(${super.getIsKeyOf()}) as (key: any, obj: object) => key is keyof typeof obj`;
	}

	protected getGetActionFunc() {
		return `(action: keyof typeof actionsDictionary) => actionsDictionary[action]`;
	}

	protected getCreateActionFunc(className: string) {
		return `(action: keyof typeof ${className}.actions, payload:any) => {
			const actionId = ${className}.getAction(action);
			return {
				action: actionId,
				payload,
			}
		}`;
	}

	protected getHasStateFunc(className: string) {
		return `(instance: ${className}, state: keyof typeof ${className}.states) => instance.state === ${className}.getState(state)`;
	}
	protected getGetStateFunc() {
		return `(state: keyof typeof statesDictionary) => statesDictionary[state]`;
	}
}
