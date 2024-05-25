import type { ICodegen } from '../../types/common.js';
import { JavaScriptCodegen } from './JavaScript.js';
import type { TDiagramAction } from '@yantrix/mermaid-parser';

export class TypeScriptCodegen extends JavaScriptCodegen implements ICodegen {
	protected getHandleStateChangeDeclaration(value: number, body: string) {
		return `const handleStateChange${value} = ({payload,action,context:prevContext,state}:{state:number|null, action:number, payload:any, context:any}) => {${body}}`;
	}

	public getImports(): string {
		return super.getImports() + '\n' + this.getTypeImports();
	}

	protected getTypeImports() {
		return `import { TAutomataBaseActionType, TAutomataBaseStateType } from '@yantrix/automata';`;
	}

	protected getStateValidator() {
		return `(s): s is TAutomataBaseStateType => Object.values(statesDictionary).includes(s)`;
	}

	protected getActionValidator() {
		return `(a): a is TAutomataBaseActionType => Object.values(actionsDictionary).includes(a)`;
	}

	protected getHandleStateChangesBodyNewState() {
		return `const newState = actionToStateDict[action as keyof typeof actionToStateDict] ?? state;`;
	}

	protected getRootReducerHandlersDict() {
		return `handlersDict[state as keyof typeof handlersDict]({action,payload,context,state})`;
	}
}
