import { createStateDiagram, parseStateDiagram } from '@yantrix/mermaid-parser';
import { set } from 'lodash-es';


export const generatePython = async (diagram: string) => {
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
