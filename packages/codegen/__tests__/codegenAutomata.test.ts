// @ts-ignore
import { actionsDictionary, GamePhaseAutomata, statesDictionary } from './fixtures/GamePhaseAutomata_generated.js';
import { beforeEach, describe, expect, test, vitest } from 'vitest';

let automata: GamePhaseAutomata;

describe('Codegen output', () => {
	describe('GamePhaseAutomata', () => {
		automata = new GamePhaseAutomata();
		const payload = {};
		const toInit = [{ action: actionsDictionary['RESET'], payload }];
		const toIntro = [...toInit, { action: actionsDictionary['RUN'], payload }];
		const toMenu = [...toIntro, { action: actionsDictionary['TO_MENU'], payload }];
		const toGameLobby = [...toMenu, { action: actionsDictionary['JOIN_GAME'], payload }];
		const toInGame = [
			...toGameLobby,
			{ action: actionsDictionary['START_GAME'], payload },
			{ action: actionsDictionary['BEGIN_GAME'], payload },
		];
		const toScoreScreen = [...toInGame, { action: actionsDictionary['END_GAME'], payload }];
		const cases = [
			[toInit, statesDictionary['INIT']],
			[toIntro, statesDictionary['INTRO']],
			[toMenu, statesDictionary['MAIN_MENU']],
			[toGameLobby, statesDictionary['GAME_LOBBY']],
			[toInGame, statesDictionary['IN_GAME']],
			[toScoreScreen, statesDictionary['SCORE_SCREEN']],
			[toScoreScreen, statesDictionary['SCORE_SCREEN']],
		];

		beforeEach(() => {
			vitest.clearAllTimers();
			vitest.clearAllTimers();
			automata = new GamePhaseAutomata();
		});
		test('Initial state', () => {
			expect(automata.state).toBe(statesDictionary['~~~START~~~']);
		});
		test('The context and state do not change with the wrong action.', () => {
			// const prevContext = { ...automata.context };
			const prevState = automata.state;
			automata.dispatch({
				action: actionsDictionary['MENU_HOVER'],
				payload: { players: 3 },
			});

			expect(automata.state).toBe(prevState);
			expect(automata.context).toStrictEqual(null);
		});
		test.each(cases)('%j -- > %j', (a: any, b) => {
			automata.setActionQueue([...a]);
			automata.consumeAction(a.length);

			expect(automata.state).toBe(b);
		});
	});
});
