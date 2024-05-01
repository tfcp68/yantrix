import type { TDiagramAction, TStateDiagram } from '@yantrix/mermaid-parser';
import { BasicActionDictionary, BasicStateDictionary } from '@yantrix/automata';

/**
 * Функция для получения словаря действий к состояниям
 */
export const getActionToStateDict = (
  transitions: Record<string, TDiagramAction>,
  stateDictionary: BasicStateDictionary,
  actionDictionary: BasicActionDictionary,
) => {
  return Object.keys(transitions).map((key) => {
    const { actionsPath } = transitions[key];
    const newState = stateDictionary.getStateValues({ keys: [key] });
    return actionsPath.map(({ action }) => {
      const actionValue = actionDictionary.getActionValues({
        keys: action,
      });
      return `${actionValue[0]}:${newState[0]},`;
    });
  });
};

/**
 * Функция для заполнения словарей состояний и действий
 */
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

/**
 * Функция для получения словаря обработчиков состояний
 */
export const getHandlerDict = (
  state: string,
  stateDictionary: BasicStateDictionary,
) => {
  const stateValue = stateDictionary.getStateValues({
    keys: [state],
  })[0];
  return `${stateValue}: handleStateChange${stateValue}, \n`;
};
