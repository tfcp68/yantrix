import type { ITypedObject, ITypedObjectProps } from './types.js';
import type {
  TDiagramAction,
  TDiagramTransitions,
} from '@yantrix/mermaid-parser';
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
  transitions: TDiagramTransitions;

  constructor(
    stateDictionary: BasicStateDictionary,
    actionDictionary: BasicActionDictionary,
    transitions: TDiagramTransitions,
  ) {
    this.actionDictionary = actionDictionary;
    this.stateDictionary = stateDictionary;
    this.transitions = transitions;
  }

  getActionToStateDict(transitions: Record<string, TDiagramAction>) {
    return Object.keys(transitions).flatMap((e) => {
      const { actionsPath } = transitions[e];
      const newState = this.stateDictionary.getStateValues({ keys: [e] });

      return actionsPath.map(({ action }) => {
        const actionValue = this.actionDictionary.getActionValues({
          keys: action,
        });
        return `${actionValue[0]}:${newState[0]},`;
      });
    });
  }

  public getHandlersDict() {
    return Object.keys(this.transitions).map((state) => {
      const stateValue = this.stateDictionary.getStateValues({
        keys: [state],
      })[0];
      return `${stateValue}: handleStateChange${stateValue}, \n`;
    });
  }

  public getHandleStateChanges(
    transitions: Record<string, TDiagramAction>,
    state: number | null,
  ) {
    return `const handleStateChange${state} = ({payload,action,context:prevContext,state}:{state:number|null, action:number, payload:any, context:any}) => {
         const actionToStateDict = {
              ${this.getActionToStateDict(transitions).join('')}     
         };
        // @ts-expect-error okay
        const newState = actionToStateDict[action] ?? state
        const isNewState = newState !== state
        
        return {state:isNewState ? newState : state, context:isNewState ? {...payload} : {...prevContext}}
    };`;
  }
}
