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
