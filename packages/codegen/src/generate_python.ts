import { createStateDiagram, parseStateDiagram } from '@yantrix/mermaid-parser';
import { toTypedObject, toTypedObjectProps } from './utils.js';
import { set } from 'lodash-es';
import type { ITypedObject, ITypedObjectProps } from './types.js';

export const generatePython = async (diagram: string) => {
  const stateDiagramStructure = await parseStateDiagram(diagram);
  const stateDiagram = await createStateDiagram(stateDiagramStructure);

  const states = {};
  const actions = {};

  for (const state of stateDiagram.states) {
    set(states, state.id, state.id);

    for (const actionPath of state.actionsPath) {
      for (const action of actionPath.action) {
        set(actions, action, action);
      }
    }
  }

  const typedStateObjectBlock = toTypedObject(states, 'state');
  const typedActionObjectBlock = toTypedObject(actions, 'action');
  const typedStateObjectProps = toTypedObjectProps(states, 'state');
  const typedActionObjectProps = toTypedObjectProps(actions, 'action');

  return `
        from typing import TypeVar, Generic, List, Any

        StateProps = TypeVar('StateProps', bound=${typedStateObjectProps.typeName})
        ActionProps = TypeVar('ActionProps', bound=${typedActionObjectProps.typeName})
		
        ${typedStateObjectBlock}
        ${typedActionObjectBlock}

        class GeneratedAutomata(createAutomata, Generic[StateProps, ActionProps, Any, Any, Any, Any]):
            def __init__(self):
                self.state = None
                self.context = {'index': -1}
            
            def root_reducer(self, action, context, payload, state):
                if (not action) or (payload is None):
                    return {
                        'state': state, 
                        'context': context
                    }
                ctx = {}
                return {
                    'state': None, 
                    'context': None
                }

            def state_validator(self):
                pass

            def action_validator(self):
                pass

            def event_validator(self):
                pass
	`;
};

export const generatePython2 = async (diagram: string) => {
  const stateDiagramStructure = await parseStateDiagram(diagram);
  const stateDiagram = await createStateDiagram(stateDiagramStructure);

  const statesDictionary = {};
  const actionsDictionary = {};

  for (const state of stateDiagram.states) {
    set(statesDictionary, '/' + state.id, '/' + state.id);

    for (const actionPath of state.actionsPath) {
      for (const action of actionPath.action) {
        set(actionsDictionary, '/' + action, '/' + action);
      }
    }
  }

  return `
        statesDictionary = ${statesDictionary}
        actionsDictionary = ${actionsDictionary}

        class GeneratedAutomata(GenericAutomata):
            def __init__(self):
                self.state = '/~~~START~~~'
                self.context = {'index': -1}
            
            handler_dict = ${statesDictionary}
            handler_dict.pop('/~~~END~~~')
            actionToStateDict = []
            
            def root_reducer(self, action, context, payload, state):
                if (not action) or (payload is None):
                    return {
                        'state': state, 
                        'context': context
                    }
                newState = state
                if actionToStateDict[action] is not None:
                    newState = actionToStateDict[action]
                isNewState = (newState != state)
                
                return {
                    state: newState if isNewState else state,
                    context: payload[:] if isNewState else prevContext[:]
                }

            def state_validator(self, s):
            return s in statesDictionary.values()

            def action_validator(self, a):
                return a in actionsDictionary.values()

            def event_validator(self):
                pass
    `;
};
