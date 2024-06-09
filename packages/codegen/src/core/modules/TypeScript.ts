import type { ICodegen } from '../../types/common.js';
import { JavaScriptCodegen } from './JavaScript.js';
import { TStateDiagram } from '@yantrix/mermaid-parser';

export class TypeScriptCodegen extends JavaScriptCodegen implements ICodegen {
	constructor(diagram: TStateDiagram) {
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
}
