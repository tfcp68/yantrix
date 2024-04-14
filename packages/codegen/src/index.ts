import type { TStateDiagram } from '@yantrix/mermaid-parser';
import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import type { ICodegenOptions } from './types.js';
import { format } from 'prettier';
import { join } from 'path';
import { cwd } from 'process';
import { readFile } from 'fs/promises';

const prettierCfgPath = join(cwd(), '.prettierrc');
const prettierCfgRaw = await readFile(prettierCfgPath, 'utf-8');
const prettierCfg = JSON.parse(prettierCfgRaw);
const fmt = async (code: string) => {
  return format(code, { ...prettierCfg, parser: 'babel-ts' });
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
      actions.addActions({ keys: [path.join(' ')] });
    }
  }

  const stateDict = states.getDictionary();
  const actionDict = actions.getDictionary();

  return fmt(`
		import { GenericAutomata } from "@yantrix/automata";

		const states = ${JSON.stringify(Object.values(stateDict), null, 2)}
		const actions = ${JSON.stringify(Object.values(actionDict), null, 2)}

		export class ${options.className} extends GenericAutomata {
			public constructor() {
				super();
				this.init({
					state: states[0],
					context: { index: -1 },
					rootReducer: ({ action, context, payload, state }) => {
						if (!action || payload === null) return { state, context };
						const ctx = { index: -1 }
						return { state: null, context: ctx };
					},
					stateValidator: (s) => states.includes(s),
					actionValidator: (a) => actions.includes(a),
					eventValidator: () => {},
				});
			}
		}
	`);
};
