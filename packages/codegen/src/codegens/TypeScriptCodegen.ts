import type { ICodegen } from '../types.js';
import type { TDiagramAction } from '@yantrix/mermaid-parser';
import { JavaScriptCodegen } from './JavaScriptCodegen.js';

export class TypeScriptCodegen extends JavaScriptCodegen implements ICodegen {
  protected getHandleStateChangeDeclaration(value: number, body: string) {
    return `const handleStateChange${value} = ({payload,action,context:prevContext,state}:{state:number|null, action:number, payload:any, context:any}) => {${body}}`;
  }

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
