import type { ICodegen } from '../../types/common.js';
import { JavaScriptCodegen } from './JavaScript.js';

export class TypeScriptCodegen extends JavaScriptCodegen implements ICodegen {
	public getImports(): string {
		return super.getImports() + '\n' + this.getTypeImports();
	}

	protected getTypeImports() {
		return `import { TAutomataBaseActionType, TAutomataBaseStateType, TValidator } from '@yantrix/automata';`;
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
