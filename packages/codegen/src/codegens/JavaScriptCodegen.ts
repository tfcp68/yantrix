import type { ICodegen } from '../types.js';
import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import type { TDiagramAction, TStateDiagram } from '@yantrix/mermaid-parser';
import {
  fillDictionaries,
  getActionToStateDict,
  getHandlerDict,
} from './shared.js';

export class JavaScriptCodegen implements ICodegen {
  stateDictionary: BasicStateDictionary;
  actionDictionary: BasicActionDictionary;
  diagram: TStateDiagram;
  handlersDict: string[];
  changeStateHandlers: string[];
  initialState: null | number;
  dictionaries: string[];

  constructor(diagram: TStateDiagram) {
    this.actionDictionary = new BasicActionDictionary();
    this.stateDictionary = new BasicStateDictionary();

    this.diagram = diagram;
    this.handlersDict = [];
    this.changeStateHandlers = [];
    this.dictionaries = [];

    fillDictionaries(diagram, this.stateDictionary, this.actionDictionary);
    this.initialState = Object.values(this.stateDictionary.getDictionary())[0];
    this.setupHandlers();
    this.setupDictionaries();
  }

  /**
   * Функция для получения обработчика изменения состояния
   */
  public getHandleStateChanges(
    transitions: Record<string, TDiagramAction>,
    state: string,
  ) {
    const value = this.stateDictionary.getStateValues({ keys: [state] });
    return `const handleStateChange${value} = ({payload,action,context:prevContext,state}) => {
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
   * Функция для создания обработчиков состояний
   */
  setupHandlers() {
    this.handlersDict.push('const handlersDict = {');

    Object.keys(this.diagram.transitions).map((state) => {
      this.handlersDict.push(getHandlerDict(state, this.stateDictionary));
      this.changeStateHandlers.push(
        this.getHandleStateChanges(this.diagram.transitions[state], state),
      );
    });
    this.handlersDict.push(' }');
  }

  /**
   * Функция для создания словарей состояний и действий
   */
  setupDictionaries() {
    this.dictionaries.push(
      `export const statesDictionary = ${JSON.stringify(this.stateDictionary.getDictionary(), null, 2)}`,
    );
    this.dictionaries.push(
      `export const actionsDictionary = ${JSON.stringify(this.actionDictionary.getDictionary(), null, 2)}`,
    );
  }

  /**
   * Функция для получения шаблона класса
   */
  getClassTemplate(className: string) {
    return `export class ${className} extends GenericAutomata {
  		 constructor() {
  			super();
  			this.init({
  				state: ${this.initialState},
  				context: { index: -1 },
                rootReducer: ({ action, context, payload, state }) => {
                  if (!action || payload === null) return { state, context };
                  return handlersDict[state]({action,payload,context,state})
  				},
  				stateValidator: (s) => Object.values(statesDictionary).includes(s),
  				actionValidator: (a) => Object.values(actionsDictionary).includes(a),
  				eventValidator: () => {},
  			});
  		}
  	}`;
  }
}
