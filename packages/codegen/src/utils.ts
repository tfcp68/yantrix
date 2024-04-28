import type { ITypedObject, ITypedObjectProps } from './types.js';
import type { TDiagramAction, TStateDiagram } from '@yantrix/mermaid-parser';
import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';

export const toUpperFirst = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const toTypedObjectProps = <T>(object: T, objName: string) => {
  const typeGuardName = `isValid${toUpperFirst(objName)}`;
  const typeName = `T${toUpperFirst(objName)}`;
  const body = JSON.stringify(object, null, 2);
  const name = `${objName}Obj`;

  return {
    typeName,
    typeGuardName,
    name,
    body,
  } satisfies ITypedObjectProps;
};

export const toTypedObject = <T>(obj: T, name: string) => {
  const props = toTypedObjectProps(obj, name);

  const codeBlock = `const ${props.name} = ${props.body}

		type ${props.typeName} = keyof typeof ${props.name}

		const ${props.typeGuardName} = (obj: any): obj is ${props.typeName} => {
			return Object.keys(${props.name}).includes(obj);
		}`;

  return {
    ...props,
    codeBlock,
  } satisfies ITypedObject;
};

export class Codegen {
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

    this.fillDictionaries();
    this.initialState = Object.values(this.stateDictionary.getDictionary())[0];
    this.setupHandlers();
    this.setupDictionaries();
  }

  getActionToStateDict(transitions: Record<string, TDiagramAction>) {
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

  public getHandlerDict(state: string) {
    const stateValue = this.stateDictionary.getStateValues({
      keys: [state],
    })[0];
    return `${stateValue}: handleStateChange${stateValue}, \n`;
  }

  fillDictionaries() {
    const stateKeys = this.diagram.states.map((s) => s.id);
    this.stateDictionary.addStates({ keys: stateKeys });

    for (const state of this.diagram.states) {
      for (const path of state.actionsPath.map((p) => p.action)) {
        const fullPath = path.join('');
        const isUniqueAction =
          this.actionDictionary.getActionValues({ keys: [fullPath] })[0] ===
          null;

        if (!isUniqueAction) {
          continue;
        }
        this.actionDictionary.addActions({ keys: [path.join(' ')] });
      }
    }
  }

  public getHandleStateChanges(
    transitions: Record<string, TDiagramAction>,
    state: string,
  ) {
    const value = this.stateDictionary.getStateValues({ keys: [state] });
    return `const handleStateChange${value} = ({payload,action,context:prevContext,state}:{state:number|null, action:number, payload:any, context:any}) => {
         const actionToStateDict = {
              ${this.getActionToStateDict(transitions)
                .flatMap((el) => el)
                .join('\n')}     
         };
        // @ts-expect-error okay
        const newState = actionToStateDict[action] ?? state
        const isNewState = newState !== state
        
        return {state:isNewState ? newState : state, context:isNewState ? {...payload} : {...prevContext}}
    };`;
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
