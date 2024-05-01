import type { ICodegen } from '../types.js';
import type { TDiagramAction } from '@yantrix/mermaid-parser';
import { getActionToStateDict } from './shared.js';
import { JavaScriptCodegen } from './JavaScriptCodegen.js';

export class TypeScriptCodegen extends JavaScriptCodegen implements ICodegen {
  /**
   * Функция для получения обработчика изменения состояния
   */
  public getHandleStateChanges(
    transitions: Record<string, TDiagramAction>,
    state: string,
  ) {
    const value = this.stateDictionary.getStateValues({ keys: [state] });
    return `const handleStateChange${value} = ({payload,action,context:prevContext,state}:{state:number|null, action:number, payload:any, context:any}) => {
         const actionToStateDict = {
              ${getActionToStateDict(
                transitions,
                this.stateDictionary,
                this.actionDictionary,
              )
                .flatMap((el) => el)
                .join('\n')}     
         };
        // @ts-expect-error okay
        const newState = actionToStateDict[action] ?? state
        const isNewState = newState !== state
        
        return {state:isNewState ? newState : state, context:isNewState ? {...payload} : {...prevContext}}
    };`;
  }

  /**
   * Функция для получения шаблона класса
   */
  public getClassTemplate(className: string) {
    return `export class ${className} extends GenericAutomata {
  		public constructor() {
  			super();
  			this.init({
  				state: ${this.initialState},
  				context: { index: -1 },
                rootReducer: ({ action, context, payload, state }) => {
                  if (!action || payload === null) return { state, context };
                  // @ts-expect-error okay
                  return handlersDict[state]({action,payload,context,state})
  				},
  				// @ts-expect-error okay
  				stateValidator: (s) => Object.values(statesDictionary).includes(s),
  				// @ts-expect-error okay
  				actionValidator: (a) => Object.values(actionsDictionary).includes(a),
  				// @ts-expect-error okay
  				eventValidator: () => {},
  			});
  		}
  	}`;
  }
}
