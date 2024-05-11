import { ICodegen, TStateDiagramSyntaxTree } from '../types.js';
import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import { TDiagramAction } from '@yantrix/mermaid-parser';
import { fillDictionaries, getStateNotesDictionary } from './shared.js';
import { TNotes } from '@yantrix/yantrix-parser';

export class JavaScriptCodegen implements ICodegen {
  stateDictionary: BasicStateDictionary;
  actionDictionary: BasicActionDictionary;
  subSyntaxDictionary: Record<string, TNotes>;
  diagram: TStateDiagramSyntaxTree;
  handlersDict: string[];
  changeStateHandlers: string[];
  initialState: null | number;
  dictionaries: string[];

  constructor(diagram: TStateDiagramSyntaxTree) {
    this.actionDictionary = new BasicActionDictionary();
    this.stateDictionary = new BasicStateDictionary();

    this.diagram = diagram;
    this.handlersDict = [];
    this.changeStateHandlers = [];
    this.dictionaries = [];

    fillDictionaries(diagram, this.stateDictionary, this.actionDictionary);

    this.subSyntaxDictionary = getStateNotesDictionary(this.diagram.notes);

    this.initialState = Object.values(this.stateDictionary.getDictionary())[0];

    this.setupHandlers();
    this.setupDictionaries();
  }

  public getImports() {
    return `import { GenericAutomata } from "@yantrix/automata";`;
  }

  setupHandlers() {
    this.handlersDict.push('const handlersDict = {');

    Object.keys(this.diagram.transitions).map((state) => {
      this.handlersDict.push(this.getHandlerDict(state));
      this.changeStateHandlers.push(
        this.getHandleStateChanges(this.diagram.transitions[state], state),
      );
    });
    this.handlersDict.push(' }');
  }

  setupDictionaries() {
    this.dictionaries.push(
      `export const statesDictionary = ${JSON.stringify(this.stateDictionary.getDictionary(), null, 2)}`,
    );
    this.dictionaries.push(
      `export const actionsDictionary = ${JSON.stringify(this.actionDictionary.getDictionary(), null, 2)}`,
    );
  }

  getClassTemplate(className: string) {
    return `export class ${className} extends GenericAutomata {
  		 constructor() {
  			super();
  			this.init({
  				state: ${this.initialState},
  				context: { getInitialContext() },
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

  getInitialContext() {
    let res: string;
    if (!this.initialState) {
      return `context: {},`;
    }
    const declarations = this.getNoteByState(this.initialState);
    declarations?.contextDescription.map((el) => {
      el.context.map((el) => {
        const { KeyItemDeclaration } = el;
      });
    });
  }

  protected getHandleStateChanges(
    transitions: Record<string, TDiagramAction>,
    state: string,
  ) {
    const value = this.stateDictionary.getStateValues({ keys: [state] })[0];
    if (!value) {
      throw new Error(`State ${state} not found`);
    }
    return this.getHandleStateChangeDeclaration(
      value,
      `
             const actionToStateDict = {
              ${this.getActionToStateDict(transitions)
                .flatMap((el) => el)
                .join('\n')}     
         };
         
         ${this.getNoteByState(value)}
        const newState = actionToStateDict[action] ?? state
        const isNewState = newState !== state
        
        return {state:isNewState ? newState : state, context:isNewState ? {...payload} : {...prevContext}}
        `,
    );
  }

  protected getHandleStateChangeDeclaration(value: number, body: string) {
    return `const handleStateChange${value} = ({payload,action,context:prevContext,state}) => {${body}}`;
  }

  private getActionToStateDict(transitions: Record<string, TDiagramAction>) {
    return Object.keys(transitions).map((key) => {
      const { actionsPath } = transitions[key];
      const newState = this.stateDictionary.getStateValues({ keys: [key] });
      return actionsPath.map(({ action }) => {
        const actionValue = this.actionDictionary.getActionValues({
          keys: action,
        });
        return `${actionValue[0]}:${newState[0]},`;
      });
    });
  }

  private getHandlerDict(state: string) {
    const stateValue = this.stateDictionary.getStateValues({
      keys: [state],
    })[0];
    return `${stateValue}: handleStateChange${stateValue}, \n`;
  }

  private getNoteByState(state: number): TNotes | null {
    const value = this.stateDictionary.getStateKeys({ states: [state] })[0];
    if (!value) {
      return null;
    }
    return this.subSyntaxDictionary[value];
  }
}
