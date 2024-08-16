import { ICodegen, TModuleParams } from '../../types/common.js';
import { JavaScriptCodegen } from './JavaScript.js';

export class TypeScriptCodegen extends JavaScriptCodegen implements ICodegen {
	constructor(params: TModuleParams) {
		super(params);
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
}
