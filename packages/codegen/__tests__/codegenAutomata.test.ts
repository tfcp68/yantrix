import {
  actionsDictionary,
  GamePhaseAutomata,
  statesDictionary,
} from './fixtures/gamePhaseAutomata.js';
import { beforeEach, describe, expect, test, vitest } from 'vitest';

let automata: GamePhaseAutomata;

describe('Codegen output', () => {
  describe('GamePhaseAutomata', () => {
    let automata = new GamePhaseAutomata();

    const payload = {};
    const toMenu = [
      { action: actionsDictionary['/RESET'], payload },
      { action: actionsDictionary['/RUN'], payload },
      { action: actionsDictionary['/TO_MENU'], payload },
    ];
    const toGameLobby = [
      ...toMenu,
      { action: actionsDictionary['/JOIN_GAME'], payload },
    ];
    const toInGame = [
      ...toGameLobby,
      { action: actionsDictionary['/START_GAME'], payload },
      { action: actionsDictionary['/BEGIN_GAME'], payload },
    ];
    const toScoreScreen = [
      ...toInGame,
      { action: actionsDictionary['/END_GAME'], payload },
    ];

    beforeEach(() => {
      vitest.clearAllTimers();
      vitest.clearAllTimers();
      automata = new GamePhaseAutomata();
    });
    test('Initial state', () => {
      expect(automata.state).toBe(statesDictionary['/~~~START~~~']);
    });
    test('Set passed context', () => {
      automata.dispatch({
        action: actionsDictionary['/RESET'],
        payload: { players: 3, score: 0 },
      });
      expect(automata.state).toBe(statesDictionary['/INIT']);
      expect(automata.context).toStrictEqual({
        players: 3,
        score: 0,
      });
    });
    test('The context and state do not change with the wrong action.', () => {
      const prevContext = { ...automata.context };
      const prevState = automata.state;
      automata.dispatch({
        action: actionsDictionary['/MENU_HOVER'],
        payload: { players: 3 },
      });

      expect(automata.state).toBe(prevState);
      expect(automata.context).toStrictEqual(prevContext);
    });
    test('[*] --> INIT: RESET', () => {
      automata.dispatch({ action: actionsDictionary['/RESET'], payload: {} });
      expect(automata.state).toBe(statesDictionary['/INIT']);
    });
    test('INIT --> INTRO: RUN', () => {
      automata.dispatch({ action: actionsDictionary['/RESET'], payload: {} });

      automata.dispatch({ action: actionsDictionary['/RUN'], payload: {} });
      expect(automata.state).toBe(statesDictionary['/INTRO']);
    });
    test('INTRO --> MAIN_MENU: TO_MENU', () => {
      automata.setActionQueue([...toMenu]);
      automata.consumeAction(toMenu.length);
      expect(automata.state).toBe(statesDictionary['/MAIN_MENU']);
    });
    test('MAIN_MENU --> MAIN_MENU: MENU_HOVER', () => {
      automata.setActionQueue([...toMenu]);
      automata.consumeAction(toMenu.length);

      automata.dispatch({ action: actionsDictionary['/TO_MENU'], payload });
      expect(automata.state).toBe(statesDictionary['/MAIN_MENU']);
    });
    test('MAIN_MENU --> GAME_LOBBY: CREATE_GAME', () => {
      automata.setActionQueue([...toMenu]);
      automata.consumeAction(toMenu.length);

      automata.dispatch({ action: actionsDictionary['/CREATE_GAME'], payload });
      expect(automata.state).toBe(statesDictionary['/GAME_LOBBY']);
    });
    test('MAIN_MENU --> GAME_LOBBY: JOIN_GAME', () => {
      automata.setActionQueue([...toMenu]);
      automata.consumeAction(toMenu.length);

      automata.dispatch({ action: actionsDictionary['/JOIN_GAME'], payload });
      expect(automata.state).toBe(statesDictionary['/GAME_LOBBY']);
    });
    test('GAME_LOBBY --> [*]: EXIT', () => {
      automata.setActionQueue([...toGameLobby]);
      automata.consumeAction(toGameLobby.length);

      automata.dispatch({ action: actionsDictionary['/EXIT'], payload });
      expect(automata.state).toBe(statesDictionary['/~~~END~~~']);
    });
    test('GAME_LOBBY --> MAIN_MENU: TO_MENU', () => {
      automata.setActionQueue([...toGameLobby]);
      automata.consumeAction(toGameLobby.length);

      automata.dispatch({ action: actionsDictionary['/TO_MENU'], payload });
      expect(automata.state).toBe(statesDictionary['/MAIN_MENU']);
    });
    test('GAME_LOBBY --> GAME_STARTING: START_GAME', () => {
      automata.setActionQueue([...toGameLobby]);
      automata.consumeAction(toGameLobby.length);

      automata.dispatch({ action: actionsDictionary['/START_GAME'], payload });
      expect(automata.state).toBe(statesDictionary['/GAME_STARTING']);
    });
    test('GAME_LOBBY --> GAME_STARTING: START_GAME', () => {
      automata.setActionQueue([...toGameLobby]);
      automata.consumeAction(toGameLobby.length);

      automata.dispatch({ action: actionsDictionary['/START_GAME'], payload });
      expect(automata.state).toBe(statesDictionary['/GAME_STARTING']);
    });
    test('IN_GAME --> [*]: EXIT', () => {
      automata.setActionQueue([...toInGame]);
      automata.consumeAction(toGameLobby.length);

      automata.dispatch({ action: actionsDictionary['/EXIT'], payload });
      expect(automata.state).toBe(statesDictionary['/~~~END~~~']);
    });
    test('IN_GAME --> SCORE_SCREEN: END_GAME', () => {
      automata.setActionQueue([...toInGame]);
      automata.consumeAction(toGameLobby.length);

      automata.dispatch({ action: actionsDictionary['/END_GAME'], payload });
      expect(automata.state).toBe(statesDictionary['/SCORE_SCREEN']);
    });
    test('IN_GAME --> MAIN_MENU: TO_MENU', () => {
      automata.setActionQueue([...toInGame]);
      automata.consumeAction(toGameLobby.length);

      automata.dispatch({ action: actionsDictionary['/TO_MENU'], payload });
      expect(automata.state).toBe(statesDictionary['/MAIN_MENU']);
    });
    test('IN_GAME --> MAIN_MENU: TO_MENU', () => {
      automata.setActionQueue([...toInGame]);
      automata.consumeAction(toGameLobby.length);

      automata.dispatch({ action: actionsDictionary['/TO_MENU'], payload });
      expect(automata.state).toBe(statesDictionary['/MAIN_MENU']);
    });
    test('SCORE_SCREEN --> MAIN_MENU: TO_MENU', () => {
      automata.setActionQueue([...toScoreScreen]);
      automata.consumeAction(toScoreScreen.length);

      automata.dispatch({ action: actionsDictionary['/TO_MENU'], payload });
      expect(automata.state).toBe(statesDictionary['/MAIN_MENU']);
    });
    test('SCORE_SCREEN --> [*]: EXIT`;', () => {
      automata.setActionQueue([...toScoreScreen]);
      automata.consumeAction(toScoreScreen.length);

      automata.dispatch({ action: actionsDictionary['/EXIT'], payload });
      expect(automata.state).toBe(statesDictionary['/~~~END~~~']);
    });
  });
});
