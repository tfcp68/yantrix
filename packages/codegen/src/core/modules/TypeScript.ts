import { ICodegen, TGetCodeOptionsMap, TModuleParams } from '../../types/common.js';
import { ModuleNames } from './index';
import { JavaScriptCodegen } from './JavaScript.js';

export class TypeScriptCodegen extends JavaScriptCodegen implements ICodegen<typeof ModuleNames.TypeScript> {
	constructor(params: TModuleParams) {
		super(params);
		this.imports['@yantrix/automata'].push('TAutomataBaseActionType', 'TAutomataBaseStateType', 'TValidator');
	}

	protected override getStateValidator(): string {
		return `(${super.getStateValidator()}) as TValidator<TAutomataBaseStateType>`;
	}

	protected override getActionValidator(): string {
		return `(${super.getActionValidator()}) as TValidator<TAutomataBaseActionType>`;
	}

	protected override getIsKeyOf(): string {
		return `(${super.getIsKeyOf()}) as (key: any, obj: object) => key is keyof typeof obj`;
	}

	protected override getGetActionFunc(): string {
		return `(action: keyof typeof actionsMap) => actionsDictionary[action]`;
	}

	protected override getCreateActionFunc(className: string): string {
		return `(action: keyof typeof actionsMap, payload:any) => {
			const actionId = ${className}.getAction(action);
			return {
				action: actionId,
				payload,
			}
		}`;
	}

	public override getCode(options: TGetCodeOptionsMap[typeof ModuleNames.TypeScript]) {
		return `
			${this.getImports()}
			${this.getDictionaries()}
			const actionsMap = ${JSON.stringify(this.getActionsMap(), null, 2)} as const
			const statesMap = ${JSON.stringify(this.getStatesMap(), null, 2)} as const
			export type TActions${options.className} = keyof typeof actionsMap;
			${this.getDefaultContext()}
			${this.getActionToStateFromState()}
			${this.getClassTemplate(options.className)}
		`;
	}

	protected override getHasStateFunc(className: string): string {
		return `(instance: ${className}, state: keyof typeof ${className}.states) => instance.state === ${className}.getState(state)`;
	}

	protected override getGetStateFunc(): string {
		return `(state: keyof typeof statesMap) => statesDictionary[state]`;
	}
}
