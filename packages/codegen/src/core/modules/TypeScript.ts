import { ICodegen, TGetCodeOptionsMap } from '../../types/common.js';
import { ModuleNames } from './index';
import { JavaScriptCodegen } from './JavaScript.js';
import {
	getActionsMap,
	getActionToStateFromState,
	getClassTemplate,
	getDefaultContext,
	getDictionariesCode,
	getImportsCode,
	getStatesMap,
} from './JavaScript/cleared';

export class TypeScriptCodegen extends JavaScriptCodegen implements ICodegen<typeof ModuleNames.TypeScript> {
	// constructor(params: TModuleParams) {
	// 	super(params);
	// 	this.imports['@yantrix/automata'].push('TAutomataBaseActionType', 'TAutomataBaseStateType', 'TValidator');
	// }

	// protected override getStateValidator(): string {
	// 	return `(${super.getStateValidator()}) as TValidator<TAutomataBaseStateType>`;
	// }
	//
	// protected override getActionValidator(): string {
	// 	return `(${super.getActionValidator()}) as TValidator<TAutomataBaseActionType>`;
	// }
	//
	// protected override getIsKeyOf(): string {
	// 	return `(${super.getIsKeyOf()}) as (key: any, obj: object) => key is keyof typeof obj`;
	// }
	//
	// protected override getGetActionFunc(): string {
	// 	return `(action: keyof typeof actionsMap) => actionsDictionary[action]`;
	// }

	// protected override getCreateActionFunc(className: string): string {
	// 	return `(action: keyof typeof actionsMap, payload:any) => {
	// 		const actionId = ${className}.getAction(action);
	// 		return {
	// 			action: actionId,
	// 			payload,
	// 		}
	// 	}`;
	// }

	public override getCode(options: TGetCodeOptionsMap[typeof ModuleNames.TypeScript]) {
		return `
			${getImportsCode({
					imports: this.imports,
				})}
			${getDictionariesCode({
					dictionaries: this.dictionaries,
				})}
			const actionsMap = ${JSON.stringify(getActionsMap({
		actionDictionary: this.actionDictionary,
	}), null, 2)} as const
			const statesMap = ${JSON.stringify(getStatesMap({
		stateDictionary: this.stateDictionary,
	}), null, 2)} as const
			export type TActions${options.className} = keyof typeof actionsMap;
			${getDefaultContext({
					expressions: this.expressions,
					diagram: this.diagram,
					stateDictionary: this.stateDictionary,
				})}
			${getActionToStateFromState({
					diagram: this.diagram,
					stateDictionary: this.stateDictionary,
					actionDictionary: this.actionDictionary,
				})}
			${getClassTemplate({
					className: options.className,
					diagram: this.diagram,
					stateDictionary: this.stateDictionary,
				})}
		`;
	}

	// protected override getHasStateFunc(className: string): string {
	// 	return `(instance: ${className}, state: keyof typeof ${className}.states) => instance.state === ${className}.getState(state)`;
	// }
	//
	// protected override getGetStateFunc(): string {
	// 	return `(state: keyof typeof statesMap) => statesDictionary[state]`;
	// }
}
