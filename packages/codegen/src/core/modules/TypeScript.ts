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

	public getUtils() {
		return this.getTypeGuards();
	}

	protected getTypeGuards() {
		return this.getIsTypeGuard();
	}

	protected getIsTypeGuard() {
		return `const isKeyOf = <T extends Object>(key:any, object: T): key is keyof T => key in object;`;
	}

	protected getRootReducerStateValidationHead() {
		return `if (!isKeyOf(state, actionToStateFromStateDict))`;
	}

	protected getRootReducerActionValidation() {
		return `if (!isKeyOf(action, actionToStateFromStateDict[state])) return { state, context };`;
	}
}
