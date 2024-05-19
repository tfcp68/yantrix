import type { ICodegen } from '../../types/common.js';
import { JavaScriptCodegen } from './JavaScript.js';

export class TypeScriptCodegen extends JavaScriptCodegen implements ICodegen {
  protected getHandleStateChangeDeclaration(value: number, body: string) {
    return `const handleStateChange${value} = ({payload,action,context:prevContext,state}:{state:number|null, action:number, payload:any, context:any}) => {${body}}`;
  }

  public getImports(): string {
    return `import { GenericAutomata, TAutomataBaseActionType, TAutomataBaseEventType, TAutomataBaseStateType } from '@yantrix/automata';`;
  }

  protected getStateValidator() {
    return `(s): s is TAutomataBaseStateType => Object.values(statesDictionary).includes(s)`;
  }
  protected getActionValidator() {
    return `(a): a is TAutomataBaseActionType => Object.values(actionsDictionary).includes(a)`;
  }
}
