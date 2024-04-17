import { GenericAutomata } from '@yantrix/automata';

export const statesDictionary = {
  '/~~~START~~~': 1696941163,
  '/INIT': 45657535,
  '/INTRO': 1415394173,
  '/MAIN_MENU': 1918712022,
  '/~~~END~~~': 2004485394,
  '/GAME_LOBBY': 487317864,
  '/GAME_STARTING': 1253633506,
  '/IN_GAME': 1301012547,
  '/SCORE_SCREEN': 1404098696,
};
export const actionsDictionary = {
  '/RESET': 1423436384,
  '/RUN': 1481692,
  '/TO_MENU': 99594860,
  '/EXIT': 45547981,
  '/MENU_HOVER': 1546956885,
  '/CREATE_GAME': 834502202,
  '/JOIN_GAME': 1675466392,
  '/START_GAME': 383736638,
  '/BEGIN_GAME': 1225901225,
  '/END_GAME': 808645083,
};

const handleStateChange1696941163 = ({
  payload,
  action,
  context: prevContext,
  state,
}: {
  state: number | null;
  action: number;
  payload: any;
  context: any;
}) => {
  const actionToStateDict = {
    1423436384: 45657535,
  };
  // @ts-expect-error okay
  const newState = actionToStateDict[action] ?? state;
  const isNewState = newState !== state;

  return {
    state: isNewState ? newState : state,
    context: isNewState ? { ...payload } : { ...prevContext },
  };
};
const handleStateChange45657535 = ({
  payload,
  action,
  context: prevContext,
  state,
}: {
  state: number | null;
  action: number;
  payload: any;
  context: any;
}) => {
  const actionToStateDict = {
    1481692: 1415394173,
  };
  // @ts-expect-error okay
  const newState = actionToStateDict[action] ?? state;
  const isNewState = newState !== state;

  return {
    state: isNewState ? newState : state,
    context: isNewState ? { ...payload } : { ...prevContext },
  };
};
const handleStateChange1415394173 = ({
  payload,
  action,
  context: prevContext,
  state,
}: {
  state: number | null;
  action: number;
  payload: any;
  context: any;
}) => {
  const actionToStateDict = {
    99594860: 1918712022,
  };
  // @ts-expect-error okay
  const newState = actionToStateDict[action] ?? state;
  const isNewState = newState !== state;

  return {
    state: isNewState ? newState : state,
    context: isNewState ? { ...payload } : { ...prevContext },
  };
};
const handleStateChange1918712022 = ({
  payload,
  action,
  context: prevContext,
  state,
}: {
  state: number | null;
  action: number;
  payload: any;
  context: any;
}) => {
  const actionToStateDict = {
    45547981: 2004485394,
    1546956885: 1918712022,
    834502202: 487317864,
    1675466392: 487317864,
  };
  // @ts-expect-error okay
  const newState = actionToStateDict[action] ?? state;
  const isNewState = newState !== state;

  return {
    state: isNewState ? newState : state,
    context: isNewState ? { ...payload } : { ...prevContext },
  };
};
const handleStateChange487317864 = ({
  payload,
  action,
  context: prevContext,
  state,
}: {
  state: number | null;
  action: number;
  payload: any;
  context: any;
}) => {
  const actionToStateDict = {
    45547981: 2004485394,
    99594860: 1918712022,
    383736638: 1253633506,
  };
  // @ts-expect-error okay
  const newState = actionToStateDict[action] ?? state;
  const isNewState = newState !== state;

  return {
    state: isNewState ? newState : state,
    context: isNewState ? { ...payload } : { ...prevContext },
  };
};
const handleStateChange1253633506 = ({
  payload,
  action,
  context: prevContext,
  state,
}: {
  state: number | null;
  action: number;
  payload: any;
  context: any;
}) => {
  const actionToStateDict = {
    1225901225: 1301012547,
  };
  // @ts-expect-error okay
  const newState = actionToStateDict[action] ?? state;
  const isNewState = newState !== state;

  return {
    state: isNewState ? newState : state,
    context: isNewState ? { ...payload } : { ...prevContext },
  };
};
const handleStateChange1301012547 = ({
  payload,
  action,
  context: prevContext,
  state,
}: {
  state: number | null;
  action: number;
  payload: any;
  context: any;
}) => {
  const actionToStateDict = {
    45547981: 2004485394,
    808645083: 1404098696,
    99594860: 1918712022,
  };
  // @ts-expect-error okay
  const newState = actionToStateDict[action] ?? state;
  const isNewState = newState !== state;

  return {
    state: isNewState ? newState : state,
    context: isNewState ? { ...payload } : { ...prevContext },
  };
};
const handleStateChange1404098696 = ({
  payload,
  action,
  context: prevContext,
  state,
}: {
  state: number | null;
  action: number;
  payload: any;
  context: any;
}) => {
  const actionToStateDict = {
    99594860: 1918712022,
    45547981: 2004485394,
  };
  // @ts-expect-error okay
  const newState = actionToStateDict[action] ?? state;
  const isNewState = newState !== state;

  return {
    state: isNewState ? newState : state,
    context: isNewState ? { ...payload } : { ...prevContext },
  };
};

const handlersDict = {
  1696941163: handleStateChange1696941163,
  45657535: handleStateChange45657535,
  1415394173: handleStateChange1415394173,
  1918712022: handleStateChange1918712022,
  487317864: handleStateChange487317864,
  1253633506: handleStateChange1253633506,
  1301012547: handleStateChange1301012547,
  1404098696: handleStateChange1404098696,
};

export class GamePhaseAutomata extends GenericAutomata {
  public constructor() {
    super();
    this.init({
      state: 1696941163,
      context: { index: -1 },
      rootReducer: ({ action, context, payload, state }) => {
        if (!action || payload === null) return { state, context };

        // @ts-expect-error okay
        return handlersDict[state]({ action, payload, context, state });
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
