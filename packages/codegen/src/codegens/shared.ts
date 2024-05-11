import type { TStateDiagram } from '@yantrix/mermaid-parser';
import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';
import { TParsedNotes } from '../types.js';
import { TNotes } from '@yantrix/yantrix-parser';

export const fillDictionaries = (
  diagram: TStateDiagram,
  stateDictionary: BasicStateDictionary,
  actionDictionary: BasicActionDictionary,
) => {
  const stateKeys = diagram.states.map((s) => s.id);
  stateDictionary.addStates({ keys: stateKeys });

  for (const state of diagram.states) {
    for (const path of state.actionsPath.map((p) => p.action)) {
      const fullPath = path.join('');
      const isUniqueAction =
        actionDictionary.getActionValues({ keys: [fullPath] })[0] === null;

      if (!isUniqueAction) {
        continue;
      }
      actionDictionary.addActions({ keys: [path.join(' ')] });
    }
  }
};
export const getStateNotesDictionary = (noteList: TParsedNotes[]) => {
  return noteList.reduce(
    (res, el) => {
      return { ...res, [el.state]: el.dict };
    },
    {} as Record<string, TNotes>,
  );
};
