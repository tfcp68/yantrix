import type { ICodegen } from '../../types/common.js';
import { JavaScriptCodegen } from './JavaScript.js';

export class TypeScriptCodegen extends JavaScriptCodegen implements ICodegen {
	protected getHandleStateChangeDeclaration(id: number, body: string) {
		return `const handleStateChange${id} = ({payload,action,context:prevContext,state}:{
					state:number|null, 
					action:keyof typeof actionToStateDict[${id}], 
					payload:any, 
					context:any
				}) => {${body}}`;
	}

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

	protected getHandleStateChangesBodyNewState() {
		return `const newState = actionToStateDict[action as keyof typeof actionToStateDict] ?? state;`;
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

	protected getRootReducerStateValidation() {
		return `if (!isKeyOf(state, actionToStateFromStateDict)) throw new Error("Invalid action")`;
	}

	protected getRootReducerActionValidation() {
		return `if (!isKeyOf(action, actionToStateFromStateDict[state])) return { state, context };`;
	}
}
