import type { TStateDiagram } from '@yantrix/mermaid-parser';
import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import type { ICodegenOptions } from './types.js';
import { format } from 'prettier';
import { join } from 'path';
import { cwd } from 'process';
import { Codegen } from './utils.js';
import { readFile } from 'fs/promises';

const prettierCfgPath = join(cwd(), '.prettierrc');
const fmt = async (code: string) => {
  try {
    const prettierCfgRaw = await readFile(prettierCfgPath, 'utf-8');
    const prettierCfg = JSON.parse(prettierCfgRaw);
    return format(code, { ...prettierCfg, parser: 'babel-ts' });
  } catch {
    return code;
  }
};

export const generate = async (
  diagram: TStateDiagram,
  options: ICodegenOptions,
) => {
  const states = new BasicStateDictionary();
  const actions = new BasicActionDictionary();

  const stateKeys = diagram.states.map((s) => s.id);
  states.addStates({ keys: stateKeys });

  for (const state of diagram.states) {
    for (const path of state.actionsPath.map((p) => p.action)) {
      const fullPath = path.join('');
      const isUniqueAction =
        actions.getActionValues({ keys: [fullPath] })[0] === null;

      if (!isUniqueAction) {
        continue;
      }
      actions.addActions({ keys: [path.join(' ')] });
    }
  }
  const { transitions } = diagram;
  const codegen = new Codegen(states, actions, transitions);

  const stateDict = states.getDictionary();
  const actionDict = actions.getDictionary();

  const initialState = Object.values(stateDict)[0];

  const stateChangeHandlers = Object.entries(transitions).map((el) => {
    const stateValue = states.getStateValues({ keys: [el[0]] })[0];
    const transitions = el[1];

    return codegen.getHandleStateChanges(transitions, stateValue);
  });

  const handlersDict = codegen.getHandlersDict();

  return fmt(`
		import { GenericAutomata } from "@yantrix/automata";

		export const statesDictionary = ${JSON.stringify(stateDict, null, 2)}
		export const actionsDictionary = ${JSON.stringify(actionDict, null, 2)}

		
	    ${stateChangeHandlers.join('')}
	    
	    const handlersDict = {
	      ${handlersDict.join('')}
	    }
		
		export class ${options.className} extends GenericAutomata {
			public constructor() {
				super();
				this.init({
					state: ${initialState},
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
		}
	`);
};
